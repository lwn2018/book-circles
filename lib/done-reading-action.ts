'use server'

import { createServerSupabaseClient, createServiceRoleClient } from './supabase-server'
import { createNotification } from './notifications'
import { sendEmail, handoffInitiatedEmailOwner, handoffInitiatedEmailBorrower } from './send-email'

export async function initiateDoneReading(bookId: string) {
  const supabase = await createServerSupabaseClient()
  const adminClient = createServiceRoleClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    // Get the book details with owner info
    const { data: book, error: bookError } = await adminClient
      .from('books')
      .select(`
        *,
        owner:owner_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', bookId)
      .single()
    
    if (bookError || !book) {
      console.error('Book fetch error:', bookError)
      return { error: `Book error: ${bookError?.message || 'Not found'}` }
    }

    // CHECK 1: If user is the owner (gift book that transferred ownership)
    // They don't need to return it - just mark as no longer borrowing
    if (book.owner_id === user.id) {
      console.log('[DoneReading] User is owner - marking as available, no handoff needed')
      
      // Clear borrower status, make available again
      await adminClient
        .from('books')
        .update({ 
          status: 'available',
          current_borrower_id: null,
          due_date: null
        })
        .eq('id', bookId)

      return { 
        success: true, 
        isOwnBook: true,
        message: 'Book marked as available on your shelf!'
      }
    }

    // CHECK 2: Verify user is the current borrower
    if (book.current_borrower_id !== user.id) {
      return { error: 'You are not currently borrowing this book' }
    }

    // CHECK 3: If this is a gift book they haven't returned yet,
    // the ownership should have transferred. If not, something went wrong.
    // For now, proceed with normal return flow.

    // Get current user's profile for name and email
    const { data: giverProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()
    
    const giverName = giverProfile?.full_name || user.user_metadata?.full_name || 'Someone'
    const giverEmail = giverProfile?.email || user.email

    // Check if there's a queue for this book
    const { data: queueEntries, error: queueError } = await adminClient
      .from('book_queue')
      .select(`
        *,
        user:user_id (
          id,
          full_name
        )
      `)
      .eq('book_id', bookId)
      .order('position', { ascending: true })

    if (queueError) {
      console.error('Queue check error:', queueError)
      return { error: `Queue error: ${queueError.message}` }
    }

    const nextInQueue = queueEntries?.[0]
    const now = new Date().toISOString()

    // Create the handoff record
    const handoffData = {
      book_id: bookId,
      giver_id: user.id,
      receiver_id: nextInQueue ? nextInQueue.user_id : book.owner_id,
      giver_confirmed_at: null,
      receiver_confirmed_at: null,
      both_confirmed_at: null
    }

    const { data: handoff, error: handoffError } = await adminClient
      .from('handoff_confirmations')
      .insert(handoffData)
      .select(`
        *,
        giver:giver_id (
          id,
          full_name
        ),
        receiver:receiver_id (
          id,
          full_name
        ),
        book:book_id (
          id,
          title,
          author,
          cover_url
        )
      `)
      .single()

    if (handoffError || !handoff) {
      console.error('Failed to create handoff:', handoffError)
      return { error: `Failed to create handoff: ${handoffError?.message || 'Unknown error'}` }
    }

    // Update book status to "in_transit"
    await adminClient
      .from('books')
      .update({ status: 'in_transit' })
      .eq('id', bookId)

    // Send notifications to both parties
    const isPagepass = !!nextInQueue
    const receiverName = nextInQueue ? nextInQueue.user.full_name : book.owner.full_name
    const receiverId = nextInQueue ? nextInQueue.user_id : book.owner_id

    // Get receiver's email
    let receiverEmail: string | null = null
    if (nextInQueue) {
      const { data: receiverProfile } = await adminClient
        .from('profiles')
        .select('email')
        .eq('id', nextInQueue.user_id)
        .single()
      receiverEmail = receiverProfile?.email || null
    } else {
      receiverEmail = (book.owner as any).email || null
    }

    // Bell notifications for both parties
    await Promise.all([
      // Notify giver (current borrower)
      createNotification({
        userId: user.id,
        type: 'book_ready',
        title: isPagepass ? '📖 Pagepass Initiated' : '📖 Return Initiated',
        message: isPagepass 
          ? `Nice! ${receiverName} is next — arrange the handoff.`
          : `We've let ${receiverName} know you're ready to return "${book.title}".`,
        link: `/shelf`,
        data: { handoffId: handoff.id, bookId }
      }),
      // Notify receiver (next in queue or owner)
      createNotification({
        userId: receiverId,
        type: 'book_ready',
        title: '📬 Book Ready for Pickup',
        message: `Time to pick up "${book.title}" from ${giverName}!`,
        link: `/shelf`,
        data: { handoffId: handoff.id, bookId }
      })
    ])

    // Email notifications for both parties
    const handoffUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pagepass.app'}/shelf`
    
    // Email to giver (borrower returning the book)
    if (giverEmail) {
      const emailTemplate = handoffInitiatedEmailOwner(
        giverName,
        receiverName,
        book.title,
        handoffUrl
      )
      await sendEmail({
        to: giverEmail,
        subject: `Time to hand off "${book.title}" to ${receiverName}!`,
        html: emailTemplate.html
      })
    }
    
    // Email to receiver (owner or next in queue)
    if (receiverEmail) {
      const emailTemplate = handoffInitiatedEmailBorrower(
        giverName,
        receiverName,
        book.title,
        handoffUrl
      )
      await sendEmail({
        to: receiverEmail,
        subject: `Time to pick up "${book.title}" from ${giverName}!`,
        html: emailTemplate.html
      })
    }

    return { 
      success: true, 
      handoffId: handoff.id,
      isPagepass,
      receiverName 
    }
  } catch (error: any) {
    console.error('Done reading error:', error)
    return { error: error.message || 'Failed to initiate handoff' }
  }
}

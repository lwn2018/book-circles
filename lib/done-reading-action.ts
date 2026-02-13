'use server'

import { createServerSupabaseClient, createServiceRoleClient } from './supabase-server'
import { createNotification } from './notifications'

export async function initiateDoneReading(bookId: string) {
  const supabase = await createServerSupabaseClient()
  const adminClient = createServiceRoleClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    // Get the book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        *,
        owner:owner_id (
          id,
          full_name
        )
      `)
      .eq('id', bookId)
      .eq('current_borrower_id', user.id)
      .single()

    if (bookError || !book) {
      return { error: 'Book not found or you are not the current borrower' }
    }

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
      return { error: 'Failed to check queue' }
    }

    const nextInQueue = queueEntries?.[0]
    const now = new Date().toISOString()

    // Create the handoff record
    const handoffData = {
      book_id: bookId,
      giver_id: user.id,
      receiver_id: nextInQueue ? nextInQueue.user_id : book.owner_id,
      initiated_at: now,
      giver_confirmed_at: null,
      receiver_confirmed_at: null,
      both_confirmed_at: null,
      is_gift: book.gift_on_borrow || false
    }

    const { data: handoff, error: handoffError } = await adminClient
      .from('handoffs')
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
      return { error: 'Failed to initiate handoff' }
    }

    // Update book status to "passing"
    await adminClient
      .from('books')
      .update({ status: 'passing' })
      .eq('id', bookId)

    // Send notifications to both parties
    const isPagepass = !!nextInQueue
    const receiverName = nextInQueue ? nextInQueue.user.full_name : book.owner.full_name
    const receiverId = nextInQueue ? nextInQueue.user_id : book.owner_id

    await Promise.all([
      // Notify giver (current borrower)
      createNotification({
        userId: user.id,
        type: 'handoff_initiated',
        title: isPagepass ? '📖 Pagepass Initiated' : '📖 Return Initiated',
        message: isPagepass 
          ? `Nice! ${receiverName} is next — arrange the handoff.`
          : `We've let ${receiverName} know you're ready to return "${book.title}".`,
        link: `/handoff/${handoff.id}`,
        bookId: bookId
      }),
      // Notify receiver (next in queue or owner)
      createNotification({
        userId: receiverId,
        type: 'handoff_initiated',
        title: '📬 Book Ready for Pickup',
        message: `Time to pick up "${book.title}" from ${user.user_metadata?.full_name || 'a circle member'}!`,
        link: `/handoff/${handoff.id}`,
        bookId: bookId
      })
    ])

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

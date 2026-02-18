import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, handoffInitiatedEmailOwner, handoffInitiatedEmailBorrower } from '@/lib/send-email'
import { analytics } from '@/lib/analytics'
import { logUserEvent } from '@/lib/gamification/events'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: bookId } = await params

  try {
    // Get service role client for operations that need to bypass RLS
    const adminClient = createServiceRoleClient()
    
    // Get book details with owner's contact info
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        id, 
        title, 
        owner_id, 
        status,
        profiles!books_owner_id_fkey (
          id,
          full_name,
          email,
          contact_preference_type,
          contact_preference_value,
          contact_email,
          contact_phone
        )
      `)
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Check if book is available
    if (book.status !== 'available') {
      return NextResponse.json(
        { error: 'Book is not available' },
        { status: 400 }
      )
    }

    // Check if user owns this book
    if (book.owner_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot borrow your own book' },
        { status: 400 }
      )
    }

    // Get borrower's name and email
    const { data: borrower } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const borrowerName = borrower?.full_name || 'Someone'
    const borrowerEmail = borrower?.email
    const ownerProfile = book.profiles as any
    const ownerName = ownerProfile?.full_name || 'Owner'
    const ownerEmail = ownerProfile?.email

    // Get owner's contact info for the borrower email
    // Try new fields first (contact_email/contact_phone), fall back to legacy fields
    let ownerContact: { type: 'email' | 'phone' | null, value: string | null } | undefined
    if (ownerProfile?.contact_phone) {
      ownerContact = { type: 'phone', value: ownerProfile.contact_phone }
    } else if (ownerProfile?.contact_email) {
      ownerContact = { type: 'email', value: ownerProfile.contact_email }
    } else if (ownerProfile?.contact_preference_value && ownerProfile?.contact_preference_type !== 'none') {
      ownerContact = { 
        type: ownerProfile.contact_preference_type as 'email' | 'phone',
        value: ownerProfile.contact_preference_value 
      }
    }

    // Calculate due date (30 days from now)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Update book status (use service role to bypass RLS)
    const { error: updateError } = await adminClient
      .from('books')
      .update({
        status: 'in_transit',
        current_borrower_id: user.id,
        due_date: dueDate.toISOString()
      })
      .eq('id', bookId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Create handoff confirmation record and get the ID (use service role)
    const { data: handoffData, error: handoffError } = await adminClient
      .from('handoff_confirmations')
      .insert({
        book_id: bookId,
        giver_id: book.owner_id,
        receiver_id: user.id
      })
      .select('id')
      .single()

    if (handoffError || !handoffData) {
      console.error('Handoff creation error:', handoffError)
      return NextResponse.json(
        { error: 'Failed to create handoff' },
        { status: 500 }
      )
    }

    const handoffId = handoffData.id
    const handoffUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pagepass.app'}/shelf`

    // Count total pending handoffs between these two people (owner -> borrower)
    const { count: pendingCount } = await adminClient
      .from('handoff_confirmations')
      .select('*', { count: 'exact', head: true })
      .eq('giver_id', book.owner_id)
      .eq('receiver_id', user.id)
      .is('both_confirmed_at', null)

    const totalBooks = pendingCount || 1

    // Create notification messages based on count
    let ownerMessage: string
    let borrowerMessage: string

    if (totalBooks > 1) {
      ownerMessage = `📚 You have ${totalBooks} books to hand off to ${borrowerName}!`
      borrowerMessage = `📚 ${totalBooks} books ready to pick up from ${ownerName}!`
    } else {
      ownerMessage = `Time to hand off "${book.title}" to ${borrowerName}!`
      borrowerMessage = `Time to pick up "${book.title}" from ${ownerName}!`
    }

    // Send notifications to BOTH parties (use service role)
    // Link to /shelf where batch UI groups multiple handoffs with same person
    await adminClient
      .from('notifications')
      .insert([
        {
          user_id: book.owner_id,
          type: 'handoff_initiated',
          book_id: bookId,
          sender_id: user.id,
          message: ownerMessage,
          action_url: `/shelf`,
          read: false
        },
        {
          user_id: user.id,
          type: 'handoff_initiated',
          book_id: bookId,
          sender_id: book.owner_id,
          message: borrowerMessage,
          action_url: `/shelf`,
          read: false
        }
      ])

    // Add to borrow history (use service role)
    await adminClient.from('borrow_history').insert({
      book_id: bookId,
      borrower_id: user.id,
      due_date: dueDate.toISOString()
    })

    // Send email to owner
    if (ownerEmail) {
      const emailTemplate = handoffInitiatedEmailOwner(
        ownerName,
        borrowerName,
        book.title,
        handoffUrl
      )

      await sendEmail({
        to: ownerEmail,
        subject: totalBooks > 1 
          ? `📚 ${totalBooks} books to hand off to ${borrowerName}!`
          : emailTemplate.subject,
        html: emailTemplate.html
      })
    }

    // Send email to borrower WITH owner's contact info
    if (borrowerEmail) {
      const emailTemplate = handoffInitiatedEmailBorrower(
        ownerName,
        borrowerName,
        book.title,
        handoffUrl,
        ownerContact  // Pass owner contact info
      )

      await sendEmail({
        to: borrowerEmail,
        subject: totalBooks > 1
          ? `📚 ${totalBooks} books ready to pick up from ${ownerName}!`
          : emailTemplate.subject,
        html: emailTemplate.html
      })
    }

    // Track borrow accepted (analytics) - wrapped in try-catch since analytics is client-side
    try {
      await analytics.track('borrow_accepted', {
        bookId,
        borrowerId: user.id,
        ownerId: book.owner_id,
        handoffId
      })
    } catch (analyticsError) {
      // Analytics failure shouldn't break the borrow flow
      console.warn('Analytics tracking failed:', analyticsError)
    }

    // Log event for gamification (user_events table)
    await logUserEvent(user.id, 'borrow_confirmed', {
      book_id: bookId,
      borrower_id: user.id
    })

    return NextResponse.json({
      success: true,
      message: `You're borrowing "${book.title}"! ${ownerName} has been notified.`,
      handoffId
    })
  } catch (error: any) {
    console.error('Failed to borrow book:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to borrow book' },
      { status: 500 }
    )
  }
}

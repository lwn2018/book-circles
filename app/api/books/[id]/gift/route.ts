import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, handoffInitiatedEmailBorrower } from '@/lib/send-email'

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
  const { recipientId } = await request.json()

  if (!recipientId) {
    return NextResponse.json({ error: 'Recipient ID required' }, { status: 400 })
  }

  try {
    const adminClient = createServiceRoleClient()

    // Get the book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*, owner:profiles!books_owner_id_fkey(id, full_name, email)')
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Must be owner
    if (book.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the owner can gift this book' }, { status: 403 })
    }

    // Can't gift if borrowed
    if (book.status === 'borrowed' || book.status === 'in_transit') {
      return NextResponse.json({ error: 'Cannot gift a book that is currently lent out' }, { status: 400 })
    }

    // Get recipient info
    const { data: recipient } = await adminClient
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', recipientId)
      .single()

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    const giverName = (book.owner as any)?.full_name || 'Someone'
    const giverEmail = (book.owner as any)?.email

    // Mark book as gift and in transit
    await adminClient
      .from('books')
      .update({
        gift_on_borrow: true,
        status: 'in_transit',
        current_borrower_id: recipientId
      })
      .eq('id', bookId)

    // Create handoff confirmation
    const { data: handoff, error: handoffError } = await adminClient
      .from('handoff_confirmations')
      .insert({
        book_id: bookId,
        giver_id: user.id,
        receiver_id: recipientId
      })
      .select('id')
      .single()

    if (handoffError || !handoff) {
      console.error('Handoff creation error:', handoffError)
      return NextResponse.json({ error: 'Failed to create handoff' }, { status: 500 })
    }

    // Notify both parties
    await adminClient
      .from('notifications')
      .insert([
        {
          user_id: user.id,
          type: 'book_gifted',
          book_id: bookId,
          sender_id: recipientId,
          message: `🎁 You're gifting "${book.title}" to ${recipient.full_name}!`,
          action_url: `/handoff/${handoff.id}`,
          read: false
        },
        {
          user_id: recipientId,
          type: 'book_gifted',
          book_id: bookId,
          sender_id: user.id,
          message: `🎁 ${giverName} is gifting you "${book.title}"!`,
          action_url: `/handoff/${handoff.id}`,
          read: false
        }
      ])

    // Send email to recipient
    const handoffUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pagepass.app'}/handoff/${handoff.id}`
    
    if (recipient.email) {
      const emailTemplate = handoffInitiatedEmailBorrower(
        giverName,
        recipient.full_name,
        book.title,
        handoffUrl
      )
      
      await sendEmail({
        to: recipient.email,
        subject: `🎁 ${giverName} is gifting you "${book.title}"!`,
        html: emailTemplate.html
      })
    }

    // Log event
    await adminClient
      .from('user_events')
      .insert({
        user_id: user.id,
        action: 'book_gifted',
        book_id: bookId,
        metadata: {
          receiver_id: recipientId,
          receiver_name: recipient.full_name,
          book_title: book.title
        }
      })

    return NextResponse.json({
      success: true,
      handoffId: handoff.id,
      message: `Book gifted to ${recipient.full_name}!`
    })
  } catch (error: any) {
    console.error('Gift error:', error)
    return NextResponse.json({ error: error.message || 'Failed to gift book' }, { status: 500 })
  }
}

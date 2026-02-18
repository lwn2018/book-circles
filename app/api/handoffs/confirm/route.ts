import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { handoffId, isGiver } = await request.json()

    if (!handoffId) {
      return NextResponse.json({ error: 'Missing handoffId' }, { status: 400 })
    }

    const adminClient = createServiceRoleClient()
    const now = new Date().toISOString()
    const field = isGiver ? 'giver_confirmed_at' : 'receiver_confirmed_at'

    // First verify user is part of this handoff and get book details
    const { data: handoff, error: fetchError } = await adminClient
      .from('handoff_confirmations')
      .select('*, books:book_id(id, title, owner_id, gift_on_borrow, current_borrower_id)')
      .eq('id', handoffId)
      .single()

    if (fetchError || !handoff) {
      return NextResponse.json({ error: 'Handoff not found' }, { status: 404 })
    }

    // Verify user is giver or receiver
    if (handoff.giver_id !== user.id && handoff.receiver_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this handoff' }, { status: 403 })
    }

    // Update the confirmation timestamp
    const { error: updateError } = await adminClient
      .from('handoff_confirmations')
      .update({ [field]: now })
      .eq('id', handoffId)

    if (updateError) {
      console.error('[confirm] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update confirmation' }, { status: 500 })
    }

    // Re-fetch to check if both confirmed
    const { data: updated } = await adminClient
      .from('handoff_confirmations')
      .select('giver_confirmed_at, receiver_confirmed_at, book_id, giver_id, receiver_id')
      .eq('id', handoffId)
      .single()

    let bothConfirmed = false

    if (updated && updated.giver_confirmed_at && updated.receiver_confirmed_at) {
      bothConfirmed = true
      console.log('[confirm] Both confirmed! Finalizing handoff...')

      // Set both_confirmed_at
      await adminClient
        .from('handoff_confirmations')
        .update({ both_confirmed_at: now })
        .eq('id', handoffId)

      const book = handoff.books as any
      const bookOwnerId = book?.owner_id

      // Determine handoff type by comparing giver/receiver to book owner
      const isGiverTheOwner = updated.giver_id === bookOwnerId
      const isReceiverTheOwner = updated.receiver_id === bookOwnerId
      const isGift = book?.gift_on_borrow

      console.log('[confirm] Book owner:', bookOwnerId, 'Giver:', updated.giver_id, 'Receiver:', updated.receiver_id)
      console.log('[confirm] isGiverTheOwner:', isGiverTheOwner, 'isReceiverTheOwner:', isReceiverTheOwner, 'isGift:', isGift)

      if (isGift) {
        // GIFT: Transfer ownership to receiver
        console.log('[confirm] Gift book - transferring ownership to receiver')
        const { error: bookError } = await adminClient
          .from('books')
          .update({ 
            owner_id: updated.receiver_id,
            current_borrower_id: null,
            status: 'available',
            due_date: null
          })
          .eq('id', updated.book_id)

        if (bookError) {
          console.error('[confirm] Gift transfer error:', bookError)
        }
      } else if (isReceiverTheOwner) {
        // RETURN: Book going back to owner
        console.log('[confirm] Return handoff - book going back to owner')
        const { error: bookError } = await adminClient
          .from('books')
          .update({ 
            status: 'available',
            current_borrower_id: null,
            due_date: null
          })
          .eq('id', updated.book_id)

        if (bookError) {
          console.error('[confirm] Return update error:', bookError)
        }
      } else if (isGiverTheOwner) {
        // INITIAL BORROW: Owner lending to borrower
        console.log('[confirm] Initial borrow - setting status to borrowed')
        const { error: bookError } = await adminClient
          .from('books')
          .update({ status: 'borrowed' })
          .eq('id', updated.book_id)

        if (bookError) {
          console.error('[confirm] Borrow update error:', bookError)
        }
      } else {
        // PAGEPASS: Neither is owner - book passing between borrowers
        console.log('[confirm] Pagepass - updating current_borrower_id')
        const { error: bookError } = await adminClient
          .from('books')
          .update({ 
            current_borrower_id: updated.receiver_id,
            status: 'borrowed'
          })
          .eq('id', updated.book_id)

        if (bookError) {
          console.error('[confirm] Pagepass update error:', bookError)
        }
      }

      // Log to activity ledger
      await adminClient
        .from('activity_ledger')
        .insert({
          user_id: user.id,
          action: isGiver ? 'handoff_given' : 'handoff_received',
          book_id: updated.book_id,
          metadata: {
            handoff_id: handoffId,
            handoff_type: isGift ? 'gift' : isReceiverTheOwner ? 'return' : isGiverTheOwner ? 'borrow' : 'pagepass'
          }
        })
    }

    return NextResponse.json({ 
      success: true, 
      bothConfirmed,
      message: bothConfirmed ? 'Handoff complete!' : 'Confirmation recorded'
    })

  } catch (error: any) {
    console.error('[confirm] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to confirm' }, { status: 500 })
  }
}

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

    // First verify user is part of this handoff
    const { data: handoff, error: fetchError } = await adminClient
      .from('handoff_confirmations')
      .select('*, books:book_id(id, title, owner_id, gift_on_borrow)')
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

      // Update book status to 'borrowed' using service role (bypasses RLS)
      const { error: bookError } = await adminClient
        .from('books')
        .update({ status: 'borrowed' })
        .eq('id', updated.book_id)

      if (bookError) {
        console.error('[confirm] Book update error:', bookError)
        // Don't fail the whole request, handoff is still confirmed
      } else {
        console.log('[confirm] Book status updated to borrowed')
      }

      // Handle gift transfer if applicable
      if (handoff.books?.gift_on_borrow) {
        console.log('[confirm] Gift book - transferring ownership...')
        
        // Transfer ownership to receiver
        await adminClient
          .from('books')
          .update({ 
            owner_id: updated.receiver_id,
            current_borrower_id: null,
            status: 'available',
            due_date: null
          })
          .eq('id', updated.book_id)

        // Update book_circle_visibility - remove from giver's circles, keep receiver's
        // (This is handled separately if needed)
      }

      // Log to activity ledger
      await adminClient
        .from('activity_ledger')
        .insert({
          user_id: user.id,
          action: isGiver ? 'handoff_given' : 'handoff_received',
          book_id: updated.book_id,
          metadata: {
            handoff_id: handoffId
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

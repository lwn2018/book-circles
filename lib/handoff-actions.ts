'use server'

import { createServerSupabaseClient, createServiceRoleClient } from './supabase-server'
import { createNotification } from './notifications'
import { analytics } from './analytics'

/**
 * Initiate a handoff - creates handoff confirmation record and sets book to "in_transit"
 */
export async function initiateHandoff(
  bookId: string,
  giverId: string,
  receiverId: string
) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminClient = createServiceRoleClient() // Use service role to bypass RLS

    // Create handoff confirmation record (use service role)
    const { data: handoff, error: handoffError } = await adminClient
      .from('handoff_confirmations')
      .insert({
        book_id: bookId,
        giver_id: giverId,
        receiver_id: receiverId
      })
      .select()
      .single()

    if (handoffError) {
      console.error('Failed to create handoff confirmation:', handoffError)
      return { error: handoffError.message }
    }

    // Update book status to in_transit (use service role)
    const { error: bookError } = await adminClient
      .from('books')
      .update({ status: 'in_transit' })
      .eq('id', bookId)

    if (bookError) {
      console.error('Failed to update book status:', bookError)
      return { error: bookError.message }
    }

    // Get book details for notifications
    const { data: book } = await supabase
      .from('books')
      .select('title')
      .eq('id', bookId)
      .single()

    // Send notifications to both parties
    await Promise.all([
      createNotification({
        userId: giverId,
        type: 'book_ready',
        title: '📚 Time to hand off!',
        message: `Time to hand off "${book?.title}" to the next reader.`,
        link: `/handoff/${handoff.id}`,
        data: { handoffId: handoff.id, bookId }
      }),
      createNotification({
        userId: receiverId,
        type: 'book_ready',
        title: '📚 Your book is ready!',
        message: `"${book?.title}" is ready for pickup!`,
        link: `/handoff/${handoff.id}`,
        data: { handoffId: handoff.id, bookId }
      })
    ])

    return { handoff, error: null }
  } catch (error: any) {
    console.error('Handoff initiation error:', error)
    return { error: error.message }
  }
}

/**
 * Confirm handoff from giver or receiver side
 */
export async function confirmHandoff(
  handoffId: string,
  userId: string,
  role: 'giver' | 'receiver',
  batchId?: string // Optional: for grouping batch confirmations
) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminClient = createServiceRoleClient() // Use service role for updates

    // Get current handoff state (use adminClient to avoid RLS issues)
    const { data: handoff, error: fetchError } = await adminClient
      .from('handoff_confirmations')
      .select(`
        *,
        book:books(id, title),
        giver:giver_id(id, full_name),
        receiver:receiver_id(id, full_name)
      `)
      .eq('id', handoffId)
      .single()

    if (fetchError || !handoff) {
      console.error('Failed to fetch handoff:', fetchError)
      return { error: 'Handoff not found: ' + (fetchError?.message || 'No data') }
    }

    // Verify user is part of this handoff
    if (handoff.giver_id !== userId && handoff.receiver_id !== userId) {
      return { error: 'Not authorized' }
    }

    // Check if already confirmed by both
    if (handoff.both_confirmed_at) {
      return { error: 'Handoff already complete' }
    }

    const now = new Date().toISOString()
    const updates: any = {}

    // Mark this user's confirmation
    if (role === 'giver') {
      if (handoff.giver_confirmed_at) {
        return { error: 'Already confirmed' }
      }
      updates.giver_confirmed_at = now
    } else {
      if (handoff.receiver_confirmed_at) {
        return { error: 'Already confirmed' }
      }
      updates.receiver_confirmed_at = now
    }

    // Check if this is the second confirmation
    const otherConfirmed = role === 'giver' 
      ? handoff.receiver_confirmed_at 
      : handoff.giver_confirmed_at

    if (otherConfirmed) {
      // Both confirmed! Complete the handoff
      updates.both_confirmed_at = now

      // Update book status to borrowed and set new owner (use service role)
      await adminClient
        .from('books')
        .update({
          status: 'borrowed',
          current_borrower_id: handoff.receiver_id,
          borrowed_at: now,
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks
        })
        .eq('id', handoff.book_id)

      // Create borrow history (use service role)
      await adminClient
        .from('borrow_history')
        .insert({
          book_id: handoff.book_id,
          borrower_id: handoff.receiver_id,
          borrowed_at: now,
          due_date: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString()
        })

      // Notify both parties of completion
      await Promise.all([
        createNotification({
          userId: handoff.giver_id,
          type: 'book_returned',
          title: '✅ Handoff Complete',
          message: `${(handoff.receiver as any).full_name} confirmed receiving "${(handoff.book as any).title}"`,
          link: `/library`
        }),
        createNotification({
          userId: handoff.receiver_id,
          type: 'book_ready',
          title: '✅ Handoff Complete',
          message: `You're all set with "${(handoff.book as any).title}"! Enjoy reading.`,
          link: `/dashboard/borrowed`
        })
      ])

      // Track handoff confirmed
      await analytics.track('handoff_confirmed', {
        handoffId,
        bookId: handoff.book_id,
        giverId: handoff.giver_id,
        receiverId: handoff.receiver_id
      })

      // Log to activity ledger (use service role)
      await adminClient
        .from('activity_ledger')
        .insert({
          user_id: userId,
          action: role === 'giver' ? 'handoff_given' : 'handoff_received',
          book_id: handoff.book_id,
          batch_id: batchId || null,
          metadata: {
            handoff_id: handoffId,
            book_title: (handoff.book as any).title,
            giver_name: (handoff.giver as any).full_name,
            receiver_name: (handoff.receiver as any).full_name,
            completed_at: now
          }
        })
    } else {
      // First confirmation - nudge the other person
      const otherUserId = role === 'giver' ? handoff.receiver_id : handoff.giver_id
      const confirmerName = role === 'giver' 
        ? (handoff.giver as any).full_name 
        : (handoff.receiver as any).full_name

      await createNotification({
        userId: otherUserId,
        type: 'book_ready',
        title: '👋 Confirmation needed',
        message: `${confirmerName} confirmed the handoff of "${(handoff.book as any).title}". Can you confirm too?`,
        link: `/handoff/${handoffId}`,
        data: { handoffId }
      })
    }

    // Update handoff record (use service role)
    const { error: updateError } = await adminClient
      .from('handoff_confirmations')
      .update(updates)
      .eq('id', handoffId)

    if (updateError) {
      console.error('Failed to update handoff:', updateError)
      return { error: updateError.message }
    }

    return { 
      success: true, 
      bothConfirmed: !!updates.both_confirmed_at,
      error: null 
    }
  } catch (error: any) {
    console.error('Confirmation error:', error)
    return { error: error.message }
  }
}

/**
 * Get active handoff for a book
 */
export async function getActiveHandoff(bookId: string) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('handoff_confirmations')
      .select(`
        *,
        book:books(id, title, cover_url),
        giver:giver_id(id, full_name, contact_preference_type, contact_preference_value),
        receiver:receiver_id(id, full_name, contact_preference_type, contact_preference_value)
      `)
      .eq('book_id', bookId)
      .is('both_confirmed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Failed to fetch handoff:', error)
      return { handoff: null, error: error.message }
    }

    return { handoff: data, error: null }
  } catch (error: any) {
    console.error('Get handoff error:', error)
    return { handoff: null, error: error.message }
  }
}

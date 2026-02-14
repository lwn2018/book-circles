'use server'

import { createServerSupabaseClient, createServiceRoleClient } from './supabase-server'
import { createNotification } from './notifications'
import { analytics } from './analytics'
import { logUserEvent } from './gamification/events'

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

      // Check if this is a return to owner or a pagepass
      const { data: book } = await adminClient
        .from('books')
        .select('owner_id, retail_price_cad, borrowed_at')
        .eq('id', handoff.book_id)
        .single()

      const isReturnToOwner = book && book.owner_id === handoff.receiver_id
      const retailPrice = book?.retail_price_cad || 20.0 // Default if not set

      console.log('Handoff completion debug:', {
        bookId: handoff.book_id,
        ownerId: book?.owner_id,
        receiverId: handoff.receiver_id,
        isReturnToOwner
      })

      if (isReturnToOwner) {
        // Return to owner - set status to available, clear borrower
        const { error: updateError } = await adminClient
          .from('books')
          .update({
            status: 'available',
            current_borrower_id: null,
            borrowed_at: null,
            due_date: null
          })
          .eq('id', handoff.book_id)

        if (updateError) {
          console.error('Failed to update book on return:', updateError)
        } else {
          console.log('Successfully cleared borrower for return to owner')
        }

        // Log book_returned event for the borrower (giver in this case)
        const daysHeld = book?.borrowed_at 
          ? Math.floor((Date.now() - new Date(book.borrowed_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0

        await logUserEvent(handoff.giver_id, 'book_returned', {
          book_id: handoff.book_id,
          borrower_id: handoff.giver_id,
          days_held: daysHeld,
          retail_price: retailPrice
        })

        // Log return_confirmed event (spec requirement)
        await logUserEvent(handoff.giver_id, 'return_confirmed', {
          book_id: handoff.book_id,
          returner_id: handoff.giver_id,
          retail_price_cad: retailPrice,
          total_chain_length: 1 // TODO: Calculate actual chain length from borrow_history
        })
      } else {
        // Pagepass - set new borrower
        const { error: updateError } = await adminClient
          .from('books')
          .update({
            status: 'borrowed',
            current_borrower_id: handoff.receiver_id,
            borrowed_at: now,
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks
          })
          .eq('id', handoff.book_id)

        if (updateError) {
          console.error('Failed to update book on pagepass:', updateError)
        } else {
          console.log('Successfully set new borrower for pagepass')
        }

        // Create borrow history (use service role)
        await adminClient
          .from('borrow_history')
          .insert({
            book_id: handoff.book_id,
            borrower_id: handoff.receiver_id,
            borrowed_at: now,
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days, not hours!
          })

        // Log gamification events
        // Log book_lent for the giver (or book_passed if giver isn't the owner)
        const isOwner = book && book.owner_id === handoff.giver_id
        const eventType = isOwner ? 'book_lent' : 'book_passed'

        await logUserEvent(handoff.giver_id, eventType, {
          book_id: handoff.book_id,
          borrower_id: handoff.receiver_id,
          to_user_id: handoff.receiver_id,
          from_user_id: handoff.giver_id,
          retail_price: retailPrice
        })

        // Log book_borrowed for the receiver
        await logUserEvent(handoff.receiver_id, 'book_borrowed', {
          book_id: handoff.book_id,
          lender_id: handoff.giver_id,
          retail_price: retailPrice
        })
      }

      // Mark old handoff notifications as read (dismiss them)
      await adminClient
        .from('notifications')
        .update({ read: true })
        .eq('book_id', handoff.book_id)
        .eq('type', 'handoff_initiated')
        .is('read', false)

      // Notify both parties of completion
      if (isReturnToOwner) {
        // Return to owner notifications
        await Promise.all([
          createNotification({
            userId: handoff.giver_id,
            type: 'book_returned',
            title: '✅ Return Complete',
            message: `${(handoff.receiver as any).full_name} confirmed receiving "${(handoff.book as any).title}" back`,
            link: `/shelf`
          }),
          createNotification({
            userId: handoff.receiver_id,
            type: 'book_returned',
            title: '✅ Book Returned',
            message: `"${(handoff.book as any).title}" is back in your library`,
            link: `/library`
          })
        ])
      } else {
        // Pagepass notifications
        await Promise.all([
          createNotification({
            userId: handoff.giver_id,
            type: 'book_returned',
            title: '✅ Pagepass Complete',
            message: `${(handoff.receiver as any).full_name} confirmed receiving "${(handoff.book as any).title}"`,
            link: `/shelf`
          }),
          createNotification({
            userId: handoff.receiver_id,
            type: 'book_ready',
            title: '✅ Handoff Complete',
            message: `You're all set with "${(handoff.book as any).title}"! Enjoy reading.`,
            link: `/shelf`
          })
        ])
      }

      // Log handoff_confirmed event (spec requirement) for BOTH parties
      await logUserEvent(handoff.giver_id, 'handoff_confirmed', {
        book_id: handoff.book_id,
        from_user_id: handoff.giver_id,
        to_user_id: handoff.receiver_id,
        retail_price_cad: retailPrice
      })
      await logUserEvent(handoff.receiver_id, 'handoff_confirmed', {
        book_id: handoff.book_id,
        from_user_id: handoff.giver_id,
        to_user_id: handoff.receiver_id,
        retail_price_cad: retailPrice
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

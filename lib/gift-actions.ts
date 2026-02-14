'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { logUserEvent } from './gamification/events'

type GiftToggleResult = {
  success?: boolean
  error?: string
}

/**
 * Toggle gift status on a book
 * Only allowed when book is on shelf (not borrowed or in transit)
 */
export async function toggleGiftStatus(
  bookId: string,
  giftOn: boolean
): Promise<GiftToggleResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    // Get book with current state
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, status, owner_id')
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      return { error: 'Book not found' }
    }

    // Verify ownership
    if (book.owner_id !== user.id) {
      return { error: 'Only the owner can change gift status' }
    }

    // Check if book is in a valid state to toggle gift status
    if (book.status === 'borrowed' || book.status === 'in_transit') {
      return { 
        error: 'Gift status can only be changed while the book is on your shelf.' 
      }
    }

    // Get queue count for notifications
    const { data: queue } = await supabase
      .from('book_queue')
      .select('id, user_id')
      .eq('book_id', bookId)
      .order('position')

    const queueCount = queue?.length || 0

    // Update gift status
    await supabase
      .from('books')
      .update({ gift_on_borrow: giftOn })
      .eq('id', bookId)

    // Log activity
    await supabase
      .from('activity_ledger')
      .insert({
        event_type: giftOn ? 'book_marked_as_gift' : 'book_unmarked_as_gift',
        book_id: bookId,
        user_id: user.id,
        metadata: {
          had_queue: queueCount > 0,
          queue_size: queueCount
        }
      })

    // Notify queue members if queue exists
    if (queueCount > 0 && queue) {
      const notificationType = giftOn ? 'book_now_offered_as_gift' : 'book_now_standard_loan'
      const message = giftOn
        ? `${book.title} is now being offered as a gift! When it's your turn, you'll receive it permanently.`
        : `${book.title} is now available as a standard loan (no longer a gift).`

      const notifications = queue.map(q => ({
        user_id: q.user_id,
        type: notificationType,
        book_id: bookId,
        sender_id: user.id,
        message,
        read: false
      }))

      await supabase.from('notifications').insert(notifications)
    }

    revalidatePath('/library')
    revalidatePath(`/circles/[id]`, 'page')
    return { success: true }
  } catch (error: any) {
    console.error('Toggle gift status error:', error)
    return { error: error.message || 'Failed to toggle gift status' }
  }
}

/**
 * Complete gift transfer after handoff confirmation
 * Transfers ownership, clears queue, updates circle visibility
 */
export async function completeGiftTransfer(
  bookId: string,
  newOwnerId: string,
  circleId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    // Get book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, author, owner_id, genres, gift_on_borrow')
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      return { error: 'Book not found' }
    }

    if (!book.gift_on_borrow) {
      return { error: 'This book is not marked as a gift' }
    }

    const previousOwnerId = book.owner_id

    // Get names for notifications
    const { data: previousOwner } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', previousOwnerId)
      .single()

    const { data: newOwner } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', newOwnerId)
      .single()

    const previousOwnerName = previousOwner?.full_name || 'Someone'
    const newOwnerName = newOwner?.full_name || 'Someone'

    // Get queue members before clearing (for notifications)
    const { data: queueMembers } = await supabase
      .from('book_queue')
      .select('user_id')
      .eq('book_id', bookId)
      .neq('user_id', newOwnerId)  // Don't notify new owner again

    const clearedQueueCount = queueMembers?.length || 0

    // Transaction-like operations:
    
    // 1. Close the previous owner's ownership record
    await supabase
      .from('book_ownership_history')
      .update({ ended_at: new Date().toISOString() })
      .eq('book_id', bookId)
      .eq('owner_id', previousOwnerId)
      .is('ended_at', null)

    // 2. Create new ownership record
    await supabase
      .from('book_ownership_history')
      .insert({
        book_id: bookId,
        owner_id: newOwnerId,
        acquired_via: 'gift_transfer',
        previous_owner_id: previousOwnerId,
        circle_id: circleId
      })

    // 3. Transfer ownership in books table
    await supabase
      .from('books')
      .update({
        owner_id: newOwnerId,
        gift_on_borrow: false,  // Reset flag - new owner decides
        status: 'available',    // Book is now on new owner's shelf
        current_borrower_id: null,
        borrowed_at: null,
        due_date: null,
        borrowed_in_circle_id: null
      })
      .eq('id', bookId)

    // 4. Clear old circle visibility
    await supabase
      .from('book_circle_visibility')
      .delete()
      .eq('book_id', bookId)

    // 5. Set new circle visibility (all new owner's circles, opt-out model)
    const { data: newOwnerCircles } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', newOwnerId)

    if (newOwnerCircles && newOwnerCircles.length > 0) {
      const visibilityEntries = newOwnerCircles.map(cm => ({
        book_id: bookId,
        circle_id: cm.circle_id,
        is_visible: true
      }))

      await supabase
        .from('book_circle_visibility')
        .insert(visibilityEntries)
    }

    // 6. Clear queue
    await supabase
      .from('book_queue')
      .delete()
      .eq('book_id', bookId)

    // 7. Log to activity ledger
    await supabase
      .from('activity_ledger')
      .insert({
        event_type: 'gift_transfer',
        book_id: bookId,
        user_id: newOwnerId,
        target_user_id: previousOwnerId,
        circle_id: circleId,
        metadata: {
          previous_owner_id: previousOwnerId,
          new_owner_id: newOwnerId,
          queue_members_cleared: clearedQueueCount,
          book_title: book.title,
          book_author: book.author,
          genres: book.genres
        }
      })

    // 8. Notify both parties
    await supabase.from('notifications').insert([
      {
        user_id: previousOwnerId,
        type: 'gift_sent',
        book_id: bookId,
        sender_id: newOwnerId,
        message: `You've gifted "${book.title}" to ${newOwnerName}!`,
        read: false
      },
      {
        user_id: newOwnerId,
        type: 'gift_received',
        book_id: bookId,
        sender_id: previousOwnerId,
        message: `${previousOwnerName} gifted you "${book.title}"! It's now in your library.`,
        read: false
      }
    ])

    // Log gift_given event for previous owner (spec requirement)
    await logUserEvent(previousOwnerId, 'gift_given', {
      book_id: bookId,
      recipient_id: newOwnerId
    })

    // Log gift_received event for new owner (spec requirement)
    await logUserEvent(newOwnerId, 'gift_received', {
      book_id: bookId,
      giver_id: previousOwnerId
    })

    // 9. Notify cleared queue members
    if (queueMembers && queueMembers.length > 0) {
      const queueNotifications = queueMembers.map(q => ({
        user_id: q.user_id,
        type: 'queue_cleared_gift_transfer',
        book_id: bookId,
        sender_id: newOwnerId,
        message: `${book.title} has been gifted to ${newOwnerName}. You've been removed from the queue.`,
        read: false
      }))

      await supabase.from('notifications').insert(queueNotifications)
    }

    revalidatePath('/library')
    revalidatePath(`/circles/[id]`, 'page')
    return { success: true }
  } catch (error: any) {
    console.error('Gift transfer error:', error)
    return { error: error.message || 'Failed to complete gift transfer' }
  }
}

/**
 * Get ownership history for a book (for provenance display)
 */
export async function getBookOwnershipHistory(bookId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('book_ownership_history')
    .select(`
      id,
      acquired_via,
      acquired_at,
      ended_at,
      owner:owner_id (
        id,
        full_name
      ),
      previous_owner:previous_owner_id (
        id,
        full_name
      ),
      circle:circle_id (
        id,
        name
      )
    `)
    .eq('book_id', bookId)
    .order('acquired_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch ownership history:', error)
    return []
  }

  return data || []
}

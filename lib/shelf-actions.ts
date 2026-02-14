'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { logUserEvent } from './gamification/events'

type ToggleResult = {
  success?: boolean
  error?: string
  requiresRecall?: boolean
}

/**
 * Toggle book between on shelf (available) and off shelf
 * Handles different current states and triggers recall if needed
 */
export async function toggleBookShelfStatus(
  bookId: string
): Promise<ToggleResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    // Get book with current state
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, status, owner_id, current_borrower_id, gift_on_borrow')
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      return { error: 'Book not found' }
    }

    // Verify ownership
    if (book.owner_id !== user.id) {
      return { error: 'Only the owner can change shelf status' }
    }

    // Prevent recall for gift books
    if (book.status === 'borrowed' && book.gift_on_borrow) {
      return { 
        error: 'Gift books cannot be recalled. Once gifted, the book belongs to the borrower.' 
      }
    }

    // Get queue count for notifications
    const { data: queue } = await supabase
      .from('book_queue')
      .select('id, user_id')
      .eq('book_id', bookId)
      .order('position')

    const queueCount = queue?.length || 0

    // Handle based on current status
    switch (book.status) {
      case 'available':
        // Take off shelf immediately
        await supabase
          .from('books')
          .update({
            status: 'off_shelf',
            off_shelf_at: new Date().toISOString()
          })
          .eq('id', bookId)

        // Notify queue members
        if (queueCount > 0) {
          await notifyQueueMembers(supabase, bookId, book.title, queue!, 'book_off_shelf')
        }

        // Log activity
        await logActivity(supabase, {
          event_type: 'book_off_shelf',
          book_id: bookId,
          user_id: user.id,
          metadata: {
            had_queue: queueCount > 0,
            queue_size: queueCount,
            previous_status: 'available'
          }
        })

        // Log off_shelf_toggled event (spec requirement)
        await logUserEvent(user.id, 'off_shelf_toggled', {
          book_id: bookId,
          new_status: 'off'
        })

        revalidatePath('/library')
        revalidatePath(`/circles/[id]`, 'page')
        return { success: true }

      case 'borrowed':
        // Mark for recall, will land on off_shelf after return
        await supabase
          .from('books')
          .update({
            off_shelf_return_status: 'off_shelf',
            owner_recall_active: true // Trigger recall
          })
          .eq('id', bookId)

        // Notify current borrower of recall
        if (book.current_borrower_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: book.current_borrower_id,
              type: 'book_recalled',
              book_id: bookId,
              sender_id: user.id,
              message: `${book.title} has been recalled by the owner`,
              read: false
            })
        }

        // Log activity
        await logActivity(supabase, {
          event_type: 'book_off_shelf_with_recall',
          book_id: bookId,
          user_id: user.id,
          metadata: {
            borrower_id: book.current_borrower_id,
            had_queue: queueCount > 0
          }
        })

        revalidatePath('/library')
        return { success: true, requiresRecall: true }

      case 'in_transit':
        return { error: 'Complete the current handoff first, then you can take this book off shelf.' }

      case 'off_shelf':
        // Return to shelf
        const offShelfDuration = await calculateOffShelfDays(supabase, bookId)
        
        await supabase
          .from('books')
          .update({
            status: 'available',
            off_shelf_at: null,
            off_shelf_return_status: null
          })
          .eq('id', bookId)

        // Resume queue - notify first person
        if (queueCount > 0 && queue![0]) {
          await supabase
            .from('notifications')
            .insert({
              user_id: queue![0].user_id,
              type: 'book_available',
              book_id: bookId,
              sender_id: user.id,
              message: `${book.title} is back on the shelf and you're next!`,
              read: false
            })
        }

        // Log activity
        await logActivity(supabase, {
          event_type: 'book_on_shelf',
          book_id: bookId,
          user_id: user.id,
          metadata: {
            was_off_shelf_for_days: offShelfDuration,
            queue_resumed: queueCount > 0
          }
        })

        // Log off_shelf_toggled event (spec requirement)
        await logUserEvent(user.id, 'off_shelf_toggled', {
          book_id: bookId,
          new_status: 'on'
        })

        revalidatePath('/library')
        revalidatePath(`/circles/[id]`, 'page')
        return { success: true }

      default:
        return { error: `Unknown status: ${book.status}` }
    }
  } catch (error: any) {
    console.error('Toggle shelf status error:', error)
    return { error: error.message || 'Failed to toggle shelf status' }
  }
}

/**
 * Helper: Notify all queue members
 */
async function notifyQueueMembers(
  supabase: any,
  bookId: string,
  bookTitle: string,
  queue: { user_id: string }[],
  notificationType: string
) {
  const notifications = queue.map(q => ({
    user_id: q.user_id,
    type: notificationType,
    book_id: bookId,
    message: `${bookTitle} has been temporarily taken off the shelf. You're still in line.`,
    read: false
  }))

  await supabase.from('notifications').insert(notifications)
}

/**
 * Helper: Calculate how long book was off shelf
 */
async function calculateOffShelfDays(supabase: any, bookId: string): Promise<number> {
  const { data: book } = await supabase
    .from('books')
    .select('off_shelf_at')
    .eq('id', bookId)
    .single()

  if (!book?.off_shelf_at) return 0

  const offShelfDate = new Date(book.off_shelf_at)
  const now = new Date()
  const diffMs = now.getTime() - offShelfDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Helper: Log to activity ledger
 */
async function logActivity(
  supabase: any,
  activity: {
    event_type: string
    book_id: string
    user_id: string
    target_user_id?: string
    circle_id?: string
    metadata?: any
  }
) {
  await supabase.from('activity_ledger').insert({
    ...activity,
    created_at: new Date().toISOString()
  })
}

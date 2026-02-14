'use server'

import { createServerSupabaseClient } from './supabase-server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'
import { logUserEvent } from './gamification/events'

/**
 * Check if a book can be removed and return detailed status
 */
export async function checkBookRemovalStatus(bookId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get book details
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select(`
      *,
      current_holder:current_borrower_id (
        id,
        full_name
      )
    `)
    .eq('id', bookId)
    .eq('owner_id', user.id)
    .single()

  if (bookError || !book) {
    return { error: 'Book not found or you do not own this book' }
  }

  // Check if book is currently with someone (status: borrowed)
  if (book.status === 'borrowed' && book.current_borrower_id) {
    return {
      canRemove: false,
      scenario: 'with_someone',
      borrowerName: book.current_holder?.full_name,
      message: `This book is currently with ${book.current_holder?.full_name}. Please arrange a return or mark it as 'Yours to keep' before removing it.`
    }
  }

  // Check if book is in transit (status: in_transit or ready_for_next or passing)
  if (book.status === 'in_transit' || book.status === 'ready_for_next' || book.status === 'passing') {
    return {
      canRemove: false,
      scenario: 'passing',
      message: 'This book is in the middle of a handoff. Please wait for the handoff to complete before removing it.'
    }
  }

  // Get queue count (people requesting this book)
  const { data: requests, error: requestsError } = await supabase
    .from('book_requests')
    .select('id, requester_id, profiles!requester_id(full_name)')
    .eq('book_id', bookId)
    .eq('status', 'pending')

  const queueCount = requests?.length || 0

  if (queueCount > 0) {
    return {
      canRemove: true,
      scenario: 'with_queue',
      queueCount,
      queueMembers: requests,
      message: `Remove "${book.title}"? ${queueCount} ${queueCount === 1 ? 'person' : 'people'} in the queue will be notified it's no longer available.`
    }
  }

  // No queue, book is available
  return {
    canRemove: true,
    scenario: 'no_queue',
    message: `Remove "${book.title}" from your library? It will be removed from all your circles.`
  }
}

/**
 * Permanently remove a book from the user's library
 */
export async function removeBookPermanently(bookId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // First check if removal is allowed
  const status = await checkBookRemovalStatus(bookId)
  if (status.error) {
    return { error: status.error }
  }

  if (!status.canRemove) {
    return { error: status.message }
  }

  // Get book details before deletion
  const { data: book } = await supabase
    .from('books')
    .select('title, author')
    .eq('id', bookId)
    .single()

  if (!book) {
    return { error: 'Book not found' }
  }

  // Get queue members to notify (if any)
  const { data: queuedUsers } = await supabase
    .from('book_requests')
    .select('requester_id, profiles!requester_id(full_name)')
    .eq('book_id', bookId)
    .eq('status', 'pending')

  // Delete the book (cascade will handle related records)
  const { error: deleteError } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)
    .eq('owner_id', user.id)

  if (deleteError) {
    console.error('Error deleting book:', deleteError)
    return { error: 'Failed to remove book. Please try again.' }
  }

  // Log book_removed event (spec requirement)
  await logUserEvent(user.id, 'book_removed', {
    book_id: bookId
  })

  // Send notifications to queued users (if any)
  if (queuedUsers && queuedUsers.length > 0) {
    for (const queuedUser of queuedUsers) {
      try {
        await createNotification({
          userId: queuedUser.requester_id,
          type: 'book_removed',
          title: 'Book No Longer Available',
          message: `"${book.title}" by ${book.author || 'Unknown'} has been removed by the owner.`
        })
      } catch (error) {
        console.error('Error sending notification:', error)
      }
    }
  }

  revalidatePath('/library')
  revalidatePath('/circles')
  
  return { 
    success: true,
    message: `"${book.title}" has been permanently removed from your library.`,
    notifiedUsers: queuedUsers?.length || 0
  }
}

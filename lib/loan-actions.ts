'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

/**
 * Extend the loan period for a borrowed book
 * @param bookId - ID of the book
 * @param borrowerId - ID of current borrower
 * @param extensionDays - Number of days to extend (default: 7)
 */
export async function extendLoan(bookId: string, borrowerId: string, extensionDays: number = 7) {
  const supabase = await getSupabase()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== borrowerId) {
    return { error: 'Not authenticated or unauthorized' }
  }

  // Get book details
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*, owner:owner_id(id, full_name)')
    .eq('id', bookId)
    .single()

  if (bookError || !book) {
    return { error: 'Book not found' }
  }

  // Verify user is current borrower
  if (book.current_borrower_id !== borrowerId) {
    return { error: 'You are not currently borrowing this book' }
  }

  // Check if book can be extended
  if (book.status !== 'borrowed') {
    return { error: 'Book is not in borrowed status' }
  }

  if (book.owner_recall_active) {
    return { error: 'Owner has requested this book back. Extension not allowed.' }
  }

  // Calculate new due date
  const currentDueDate = book.due_date ? new Date(book.due_date) : new Date()
  const newDueDate = new Date(currentDueDate)
  newDueDate.setDate(newDueDate.getDate() + extensionDays)

  // Update due date
  const { error: updateError } = await supabase
    .from('books')
    .update({ due_date: newDueDate.toISOString() })
    .eq('id', bookId)

  if (updateError) {
    console.error('Failed to extend loan:', updateError)
    return { error: `Failed to extend loan: ${updateError.message}` }
  }

  // Update borrow history
  await supabase
    .from('borrow_history')
    .update({ due_date: newDueDate.toISOString() })
    .eq('book_id', bookId)
    .eq('borrower_id', borrowerId)
    .is('returned_at', null)

  return {
    success: true,
    newDueDate: newDueDate.toISOString(),
    extensionDays
  }
}

/**
 * Owner recalls their book (requests it back from borrower)
 * @param bookId - ID of the book
 * @param ownerId - ID of the owner
 */
export async function recallBook(bookId: string, ownerId: string) {
  const supabase = await getSupabase()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ownerId) {
    return { error: 'Not authenticated or unauthorized' }
  }

  // Get book details
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*, current_holder:current_borrower_id(id, full_name)')
    .eq('id', bookId)
    .single()

  if (bookError || !book) {
    return { error: 'Book not found' }
  }

  // Verify user is owner
  if (book.owner_id !== ownerId) {
    return { error: 'You are not the owner of this book' }
  }

  // Check if book is currently borrowed
  if (book.status !== 'borrowed') {
    return { error: 'Book is not currently borrowed' }
  }

  // Set owner recall flag
  const { error: updateError } = await supabase
    .from('books')
    .update({ owner_recall_active: true })
    .eq('id', bookId)

  if (updateError) {
    console.error('Failed to recall book:', updateError)
    return { error: `Failed to recall book: ${updateError.message}` }
  }

  return {
    success: true,
    borrowerName: book.current_holder?.full_name
  }
}

/**
 * Cancel owner recall
 * @param bookId - ID of the book
 * @param ownerId - ID of the owner
 */
export async function cancelRecall(bookId: string, ownerId: string) {
  const supabase = await getSupabase()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ownerId) {
    return { error: 'Not authenticated or unauthorized' }
  }

  // Get book details
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()

  if (bookError || !book) {
    return { error: 'Book not found' }
  }

  // Verify user is owner
  if (book.owner_id !== ownerId) {
    return { error: 'You are not the owner of this book' }
  }

  // Clear owner recall flag
  const { error: updateError } = await supabase
    .from('books')
    .update({ owner_recall_active: false })
    .eq('id', bookId)

  if (updateError) {
    console.error('Failed to cancel recall:', updateError)
    return { error: `Failed to cancel recall: ${updateError.message}` }
  }

  return { success: true }
}

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
 * Leave a circle
 * - Must return all borrowed books first
 * - Auto-recalls all your books lent in that circle
 * - Hides your books from that circle
 * - Removes you from circle members
 */
export async function leaveCircle(circleId: string, userId: string) {
  const supabase = await getSupabase()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return { error: 'Not authenticated' }
  }

  // Check if user is in the circle
  const { data: membership, error: memberError } = await supabase
    .from('circle_members')
    .select('*')
    .eq('circle_id', circleId)
    .eq('user_id', userId)
    .single()

  if (memberError || !membership) {
    return { error: 'You are not a member of this circle' }
  }

  // Check for borrowed books in this circle
  const { data: borrowedBooks, error: borrowedError } = await supabase
    .from('books')
    .select('id, title, borrowed_in_circle_id')
    .eq('current_borrower_id', userId)
    .eq('borrowed_in_circle_id', circleId)
    .eq('status', 'borrowed')

  if (borrowedError) {
    return { error: `Failed to check borrowed books: ${borrowedError.message}` }
  }

  if (borrowedBooks && borrowedBooks.length > 0) {
    return { 
      error: `You must return ${borrowedBooks.length} borrowed book(s) before leaving: ${borrowedBooks.map(b => b.title).join(', ')}` 
    }
  }

  // Get all books you own that are currently lent in this circle
  const { data: lentBooks, error: lentError } = await supabase
    .from('books')
    .select('id, title, borrowed_in_circle_id')
    .eq('owner_id', userId)
    .eq('borrowed_in_circle_id', circleId)
    .eq('status', 'borrowed')

  if (lentError) {
    return { error: `Failed to check lent books: ${lentError.message}` }
  }

  // Auto-recall all your lent books
  if (lentBooks && lentBooks.length > 0) {
    for (const book of lentBooks) {
      await supabase
        .from('books')
        .update({ owner_recall_active: true })
        .eq('id', book.id)
    }
  }

  // Hide all your books from this circle
  // First get all your book IDs
  const { data: yourBooks } = await supabase
    .from('books')
    .select('id')
    .eq('owner_id', userId)

  if (yourBooks && yourBooks.length > 0) {
    const bookIds = yourBooks.map(b => b.id)
    
    await supabase
      .from('book_circle_visibility')
      .update({ is_visible: false })
      .eq('circle_id', circleId)
      .in('book_id', bookIds)
  }

  // Remove from circle members
  const { error: removeError } = await supabase
    .from('circle_members')
    .delete()
    .eq('circle_id', circleId)
    .eq('user_id', userId)

  if (removeError) {
    return { error: `Failed to leave circle: ${removeError.message}` }
  }

  return { 
    success: true,
    recalledBooks: lentBooks?.length || 0
  }
}

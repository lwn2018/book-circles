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
 * Toggle book visibility in a specific circle
 */
export async function toggleBookVisibility(bookId: string, circleId: string, isVisible: boolean) {
  const supabase = await getSupabase()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user owns the book
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('owner_id')
    .eq('id', bookId)
    .single()

  if (bookError || !book) {
    return { error: 'Book not found' }
  }

  if (book.owner_id !== user.id) {
    return { error: 'You do not own this book' }
  }

  // Verify user is in the circle
  const { data: membership, error: memberError } = await supabase
    .from('circle_members')
    .select('id')
    .eq('circle_id', circleId)
    .eq('user_id', user.id)
    .single()

  if (memberError || !membership) {
    return { error: 'You are not a member of this circle' }
  }

  // Upsert visibility setting
  const { error: upsertError } = await supabase
    .from('book_circle_visibility')
    .upsert({
      book_id: bookId,
      circle_id: circleId,
      is_visible: isVisible
    }, {
      onConflict: 'book_id,circle_id'
    })

  if (upsertError) {
    console.error('Failed to update visibility:', upsertError)
    return { error: `Failed to update visibility: ${upsertError.message}` }
  }

  return { success: true, isVisible }
}

/**
 * Bulk toggle visibility for multiple books in a circle
 */
export async function bulkToggleVisibility(
  bookIds: string[], 
  circleId: string, 
  isVisible: boolean
) {
  const supabase = await getSupabase()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user owns all books
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id, owner_id')
    .in('id', bookIds)

  if (booksError || !books) {
    return { error: 'Failed to fetch books' }
  }

  const notOwned = books.filter(b => b.owner_id !== user.id)
  if (notOwned.length > 0) {
    return { error: 'You do not own all selected books' }
  }

  // Verify user is in the circle
  const { data: membership, error: memberError } = await supabase
    .from('circle_members')
    .select('id')
    .eq('circle_id', circleId)
    .eq('user_id', user.id)
    .single()

  if (memberError || !membership) {
    return { error: 'You are not a member of this circle' }
  }

  // Bulk upsert visibility settings
  const visibilityRecords = bookIds.map(bookId => ({
    book_id: bookId,
    circle_id: circleId,
    is_visible: isVisible
  }))

  const { error: upsertError } = await supabase
    .from('book_circle_visibility')
    .upsert(visibilityRecords, {
      onConflict: 'book_id,circle_id'
    })

  if (upsertError) {
    console.error('Failed to bulk update visibility:', upsertError)
    return { error: `Failed to update visibility: ${upsertError.message}` }
  }

  return { success: true, count: bookIds.length }
}

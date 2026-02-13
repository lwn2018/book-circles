import { createServerSupabaseClient } from './supabase-server'
import { getRetailPrice } from './gamification/retail-price'
import { logUserEvent } from './gamification/events'

export type AddBookInput = {
  title: string
  author?: string | null
  isbn?: string | null
  binding?: string | null
  coverUrl?: string | null
  userId: string
  circleIds: string[]
  source?: 'barcode' | 'search' | 'manual'
}

/**
 * Add a book to user's library with retail price capture
 */
export async function addBook(input: AddBookInput) {
  'use server'
  try {
    const supabase = await createServerSupabaseClient()

    // Fetch retail price
    const retailPrice = await getRetailPrice(input.isbn || null, input.binding)

    // Create the book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        title: input.title.trim(),
        author: input.author?.trim() || null,
        isbn: input.isbn?.trim() || null,
        binding: input.binding?.trim() || null,
        cover_url: input.coverUrl?.trim() || null,
        owner_id: input.userId,
        status: 'available',
        retail_price_cad: retailPrice
      })
      .select()
      .single()

    if (bookError) {
      console.error('Failed to create book:', bookError)
      return { error: bookError.message, book: null }
    }

    // Create visibility entries for circles
    if (input.circleIds.length > 0) {
      // Get all user's circles to create entries for all of them
      const { data: allCircles } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', input.userId)

      const allCircleIds = allCircles?.map(c => c.circle_id) || []

      const visibilityEntries = allCircleIds.map(circleId => ({
        book_id: book.id,
        circle_id: circleId,
        is_visible: input.circleIds.includes(circleId)
      }))

      if (visibilityEntries.length > 0) {
        const { error: visError } = await supabase
          .from('book_circle_visibility')
          .insert(visibilityEntries)

        if (visError) {
          console.error('Failed to set visibility:', visError)
          // Don't block on visibility errors
        }
      }
    }

    // Log gamification event
    await logUserEvent(input.userId, 'book_added', {
      book_id: book.id,
      source: input.source || 'manual',
      retail_price: retailPrice
    })

    return { book, error: null }
  } catch (error: any) {
    console.error('Add book error:', error)
    return { error: error.message || 'Failed to add book', book: null }
  }
}

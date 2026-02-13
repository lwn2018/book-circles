/**
 * Retail Price Utilities
 * Fetch and estimate book retail prices for gamification value tracking
 */

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY

/**
 * Fetch retail price from Google Books API
 */
export async function fetchRetailPrice(isbn: string | null): Promise<number | null> {
  if (!isbn || !GOOGLE_BOOKS_API_KEY) return null

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${GOOGLE_BOOKS_API_KEY}`
    const response = await fetch(url, { next: { revalidate: 86400 } }) // Cache for 24h

    if (!response.ok) return null

    const data = await response.json()

    if (data.items && data.items.length > 0) {
      const book = data.items[0]
      const saleInfo = book.saleInfo

      // Check for CAD price first
      if (saleInfo?.listPrice?.currencyCode === 'CAD') {
        return saleInfo.listPrice.amount
      }

      // Convert USD to CAD (rough estimate: 1.35 exchange rate)
      if (saleInfo?.listPrice?.currencyCode === 'USD') {
        return Math.round(saleInfo.listPrice.amount * 1.35 * 100) / 100
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching retail price:', error)
    return null
  }
}

/**
 * Estimate retail price based on book format if API fails
 */
export function estimateRetailPrice(binding?: string | null): number {
  if (!binding) return 20.0 // Default

  const bindingLower = binding.toLowerCase()

  if (bindingLower.includes('hardcover') || bindingLower.includes('hardback')) {
    return 25.0
  }

  if (bindingLower.includes('paperback') || bindingLower.includes('softcover')) {
    return 15.0
  }

  if (bindingLower.includes('mass market')) {
    return 12.0
  }

  return 20.0 // Default fallback
}

/**
 * Get retail price with fallback logic:
 * 1. Try Google Books API
 * 2. Estimate from binding
 * 3. Default to $20
 */
export async function getRetailPrice(
  isbn: string | null,
  binding?: string | null
): Promise<number> {
  // Try API first
  const apiPrice = await fetchRetailPrice(isbn)
  if (apiPrice !== null) return apiPrice

  // Fall back to estimation
  return estimateRetailPrice(binding)
}

/**
 * Backfill retail prices for existing books without prices
 */
export async function backfillRetailPrices(limit = 100): Promise<{
  processed: number
  updated: number
  failed: number
}> {
  const { createServerSupabaseClient } = await import('@/lib/supabase-server')
  const supabase = await createServerSupabaseClient()

  // Get books without retail prices
  const { data: books, error } = await supabase
    .from('books')
    .select('id, isbn, binding')
    .is('retail_price_cad', null)
    .limit(limit)

  if (error || !books) {
    console.error('Error fetching books for backfill:', error)
    return { processed: 0, updated: 0, failed: 0 }
  }

  let updated = 0
  let failed = 0

  for (const book of books) {
    try {
      const price = await getRetailPrice(book.isbn, book.binding)

      const { error: updateError } = await supabase
        .from('books')
        .update({ retail_price_cad: price })
        .eq('id', book.id)

      if (updateError) {
        failed++
        console.error(`Failed to update price for book ${book.id}:`, updateError)
      } else {
        updated++
      }

      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      failed++
      console.error(`Error processing book ${book.id}:`, error)
    }
  }

  return {
    processed: books.length,
    updated,
    failed
  }
}

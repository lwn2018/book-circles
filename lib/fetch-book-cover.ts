/**
 * Cascading cover art lookup utility
 * Tries multiple sources in order and returns the first successful cover URL
 */

type FetchBookCoverResult = {
  coverUrl: string | null
  source?: 'google-books' | 'open-library'
}

export async function fetchBookCover(
  isbn?: string | null,
  title?: string | null,
  author?: string | null
): Promise<FetchBookCoverResult> {
  // Try Google Books API first (richer metadata)
  if (isbn) {
    const googleResult = await tryGoogleBooks(isbn)
    if (googleResult) {
      return { coverUrl: googleResult, source: 'google-books' }
    }
  }

  // Try Open Library as backup
  if (isbn) {
    const openLibResult = await tryOpenLibrary(isbn)
    if (openLibResult) {
      return { coverUrl: openLibResult, source: 'open-library' }
    }
  }

  // Fall back to title+author search if no ISBN or ISBN failed
  if (title) {
    const googleResult = await tryGoogleBooksSearch(title, author)
    if (googleResult) {
      return { coverUrl: googleResult, source: 'google-books' }
    }
  }

  return { coverUrl: null }
}

async function tryGoogleBooks(isbn: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      const imageLinks = data.items[0].volumeInfo?.imageLinks
      if (imageLinks?.thumbnail) {
        // Google Books thumbnails are http by default, upgrade to https
        return imageLinks.thumbnail.replace('http://', 'https://')
      }
    }
    
    return null
  } catch (error) {
    console.error('Google Books API error:', error)
    return null
  }
}

async function tryGoogleBooksSearch(
  title: string,
  author?: string | null
): Promise<string | null> {
  try {
    const query = author 
      ? `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`
      : `intitle:${encodeURIComponent(title)}`
    
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      const imageLinks = data.items[0].volumeInfo?.imageLinks
      if (imageLinks?.thumbnail) {
        return imageLinks.thumbnail.replace('http://', 'https://')
      }
    }
    
    return null
  } catch (error) {
    console.error('Google Books search error:', error)
    return null
  }
}

async function tryOpenLibrary(isbn: string): Promise<string | null> {
  try {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    
    // Open Library doesn't return content-length in HEAD requests
    // We need to fetch and check the actual size
    const response = await fetch(url)
    
    if (response.ok) {
      const buffer = await response.arrayBuffer()
      // Open Library returns a 1x1 pixel placeholder (~43 bytes) for missing covers
      // Real covers are typically >1000 bytes
      if (buffer.byteLength > 1000) {
        return url
      }
    }
    
    return null
  } catch (error) {
    console.error('Open Library API error:', error)
    return null
  }
}

/**
 * Helper to validate ISBN format (10 or 13 digits)
 */
export function isValidISBN(isbn?: string | null): boolean {
  if (!isbn) return false
  const cleaned = isbn.replace(/[-\s]/g, '')
  return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned)
}

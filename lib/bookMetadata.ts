/**
 * Book Metadata Lookup Service
 * 
 * Cascades through multiple APIs to get comprehensive book metadata and cover art:
 * 1. Google Books API (free)
 * 2. ISBNdb (paid)
 * 3. Open Library (free)
 * 4. Styled placeholder (fallback)
 * 
 * Merges results with first-non-null priority.
 * Downloads and caches cover images to Supabase Storage.
 */

import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY
const ISBNDB_API_KEY = process.env.ISBNDB_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface BookMetadata {
  isbn13?: string
  isbn10?: string
  title?: string
  author?: string
  cover_url?: string
  cover_source?: 'google' | 'isbndb' | 'openlibrary' | 'placeholder'
  retail_price_cad?: number
  format?: string
  page_count?: number
  publish_date?: string
  publisher?: string
  description?: string
  language?: string
  metadata_sources: string[]
  metadata_updated_at: string
}

/**
 * Main metadata lookup function
 */
export async function fetchBookMetadata(isbn: string): Promise<BookMetadata> {
  const result: BookMetadata = {
    metadata_sources: [],
    metadata_updated_at: new Date().toISOString()
  }

  // Normalize ISBN
  const cleanIsbn = isbn.replace(/[-\s]/g, '')
  if (cleanIsbn.length === 13) {
    result.isbn13 = cleanIsbn
  } else if (cleanIsbn.length === 10) {
    result.isbn10 = cleanIsbn
  }

  // Try Google Books first
  try {
    const googleData = await fetchFromGoogleBooks(cleanIsbn)
    if (googleData) {
      mergeMetadata(result, googleData, 'google')
    }
  } catch (error) {
    console.error('Google Books API error:', error)
  }

  // Try ISBNdb second
  try {
    const isbndbData = await fetchFromISBNdb(cleanIsbn)
    if (isbndbData) {
      mergeMetadata(result, isbndbData, 'isbndb')
    }
  } catch (error) {
    console.error('ISBNdb API error:', error)
  }

  // Try Open Library third (only if still missing cover or key fields)
  if (!result.cover_url || !result.title || !result.author) {
    try {
      const openLibData = await fetchFromOpenLibrary(cleanIsbn)
      if (openLibData) {
        mergeMetadata(result, openLibData, 'openlibrary')
      }
    } catch (error) {
      console.error('Open Library API error:', error)
    }
  }

  // Download and cache cover image if found
  if (result.cover_url && result.cover_source !== 'placeholder') {
    try {
      const cachedUrl = await cacheBookCover(result.cover_url, result.isbn13 || result.isbn10 || cleanIsbn)
      if (cachedUrl) {
        result.cover_url = cachedUrl
      }
    } catch (error) {
      console.error('Cover caching error:', error)
    }
  }

  return result
}

/**
 * Fetch from Google Books API
 */
async function fetchFromGoogleBooks(isbn: string): Promise<Partial<BookMetadata> | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : ''}`
  
  const response = await fetch(url)
  if (!response.ok) return null

  const data = await response.json()
  if (!data.items || data.items.length === 0) return null

  const book = data.items[0].volumeInfo
  const industryIdentifiers = book.industryIdentifiers || []
  
  return {
    title: book.title,
    author: book.authors?.join(', '),
    cover_url: book.imageLinks?.thumbnail?.replace('http://', 'https://'),
    publisher: book.publisher,
    publish_date: book.publishedDate,
    page_count: book.pageCount,
    description: book.description,
    language: book.language,
    isbn13: industryIdentifiers.find((id: any) => id.type === 'ISBN_13')?.identifier,
    isbn10: industryIdentifiers.find((id: any) => id.type === 'ISBN_10')?.identifier
  }
}

/**
 * Fetch from ISBNdb API
 */
async function fetchFromISBNdb(isbn: string): Promise<Partial<BookMetadata> | null> {
  if (!ISBNDB_API_KEY) {
    console.warn('ISBNdb API key not configured')
    return null
  }

  const url = `https://api2.isbndb.com/book/${isbn}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': ISBNDB_API_KEY
    }
  })

  // Log rate limit info
  const remaining = response.headers.get('X-RateLimit-Remaining')
  if (remaining) {
    console.log(`ISBNdb rate limit remaining: ${remaining}`)
  }

  if (!response.ok) {
    if (response.status === 429) {
      console.warn('ISBNdb rate limit hit, will retry...')
      // Wait 60 seconds and retry once
      await new Promise(resolve => setTimeout(resolve, 60000))
      return fetchFromISBNdb(isbn)
    }
    return null
  }

  const data = await response.json()
  const book = data.book
  if (!book) return null

  return {
    title: book.title,
    author: book.authors?.join(', '),
    cover_url: book.image,
    isbn13: book.isbn13,
    isbn10: book.isbn,
    retail_price_cad: book.msrp ? parseFloat(book.msrp) : undefined,
    format: book.binding,
    page_count: book.pages ? parseInt(book.pages) : undefined,
    publish_date: book.date_published,
    publisher: book.publisher,
    description: book.synopsis,
    language: book.language
  }
}

/**
 * Fetch from Open Library API
 */
async function fetchFromOpenLibrary(isbn: string): Promise<Partial<BookMetadata> | null> {
  // Try cover first
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
  
  const coverResponse = await fetch(coverUrl, { method: 'HEAD' })
  const hasCover = coverResponse.ok && coverResponse.status !== 404

  // Try book data
  const dataUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
  const dataResponse = await fetch(dataUrl)
  
  if (!dataResponse.ok) {
    return hasCover ? { cover_url: coverUrl } : null
  }

  const data = await dataResponse.json()
  const bookKey = `ISBN:${isbn}`
  const book = data[bookKey]
  
  if (!book && !hasCover) return null

  return {
    title: book?.title,
    author: book?.authors?.map((a: any) => a.name).join(', '),
    cover_url: hasCover ? coverUrl : undefined,
    publisher: book?.publishers?.[0]?.name,
    publish_date: book?.publish_date,
    page_count: book?.number_of_pages
  }
}

/**
 * Merge metadata from a source, only filling null fields
 */
function mergeMetadata(target: BookMetadata, source: Partial<BookMetadata>, sourceName: string) {
  let addedData = false

  // Merge each field if target doesn't have it
  if (!target.title && source.title) {
    target.title = source.title
    addedData = true
  }
  if (!target.author && source.author) {
    target.author = source.author
    addedData = true
  }
  if (!target.cover_url && source.cover_url) {
    target.cover_url = source.cover_url
    target.cover_source = sourceName as any
    addedData = true
  }
  if (!target.isbn13 && source.isbn13) {
    target.isbn13 = source.isbn13
    addedData = true
  }
  if (!target.isbn10 && source.isbn10) {
    target.isbn10 = source.isbn10
    addedData = true
  }
  if (!target.retail_price_cad && source.retail_price_cad) {
    target.retail_price_cad = source.retail_price_cad
    addedData = true
  }
  if (!target.format && source.format) {
    target.format = source.format
    addedData = true
  }
  if (!target.page_count && source.page_count) {
    target.page_count = source.page_count
    addedData = true
  }
  if (!target.publish_date && source.publish_date) {
    target.publish_date = source.publish_date
    addedData = true
  }
  if (!target.publisher && source.publisher) {
    target.publisher = source.publisher
    addedData = true
  }
  if (!target.description && source.description) {
    target.description = source.description
    addedData = true
  }
  if (!target.language && source.language) {
    target.language = source.language
    addedData = true
  }

  // Track which sources contributed data
  if (addedData && !target.metadata_sources.includes(sourceName)) {
    target.metadata_sources.push(sourceName)
  }
}

/**
 * Download and cache cover image to Supabase Storage
 */
async function cacheBookCover(imageUrl: string, isbn: string): Promise<string | null> {
  try {
    // Download image
    const response = await fetch(imageUrl)
    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Resize with sharp (max 400px wide, maintain aspect ratio)
    const resized = await sharp(buffer)
      .resize(400, null, { 
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    // Upload to Supabase Storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const filename = `${isbn}.jpg`
    
    const { data, error } = await supabase.storage
      .from('covers')
      .upload(filename, resized, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (error) {
      console.error('Supabase Storage upload error:', error)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('covers')
      .getPublicUrl(filename)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error caching cover:', error)
    return null
  }
}

/**
 * Delay helper for rate limiting
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

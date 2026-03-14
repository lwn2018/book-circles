import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY
const ISBNDB_API_KEY = process.env.ISBNDB_API_KEY

interface BookResult {
  id: string
  title: string
  author: string | null
  isbn: string | null
  coverUrl: string | null
  source: 'google' | 'isbndb'
}

async function searchGoogleBooks(query: string): Promise<BookResult[]> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10${GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : ''}`
    const response = await fetch(url)
    const data = await response.json()
    
    if (!data.items) return []
    
    return data.items.map((item: any) => ({
      id: `google-${item.id}`,
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors?.join(', ') || null,
      isbn: item.volumeInfo.industryIdentifiers?.find((id: any) => 
        id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier || null,
      coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
      source: 'google' as const
    }))
  } catch (error) {
    console.error('Google Books search error:', error)
    return []
  }
}

async function searchISBNdb(query: string): Promise<BookResult[]> {
  if (!ISBNDB_API_KEY) return []
  
  try {
    const url = `https://api2.isbndb.com/books/${encodeURIComponent(query)}?page=1&pageSize=10`
    const response = await fetch(url, {
      headers: { 'Authorization': ISBNDB_API_KEY }
    })
    const data = await response.json()
    
    if (!data.books) return []
    
    return data.books.map((book: any) => ({
      id: `isbndb-${book.isbn13 || book.isbn}`,
      title: book.title,
      author: book.authors?.join(', ') || null,
      isbn: book.isbn13 || book.isbn || null,
      coverUrl: book.image || null,
      source: 'isbndb' as const
    }))
  } catch (error) {
    console.error('ISBNdb search error:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Search both sources in parallel
  const [googleResults, isbndbResults] = await Promise.all([
    searchGoogleBooks(query),
    searchISBNdb(query)
  ])

  // Merge and dedupe - prioritize ISBNdb (better for recent books)
  const seen = new Set<string>()
  const results: BookResult[] = []

  for (const book of isbndbResults) {
    const key = book.isbn || book.title.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      results.push(book)
    }
  }

  for (const book of googleResults) {
    const key = book.isbn || book.title.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      results.push(book)
    }
  }

  return NextResponse.json({ 
    results: results.slice(0, 8),
    sources: { google: googleResults.length, isbndb: isbndbResults.length }
  })
}

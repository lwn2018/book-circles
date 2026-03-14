import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY
const ISBNDB_API_KEY = process.env.ISBNDB_API_KEY

interface BookResult {
  id: string
  title: string
  author: string | null
  isbn: string | null
  coverUrl: string | null
  source: 'google' | 'isbndb' | 'openlibrary'
}

async function searchGoogleBooks(query: string): Promise<BookResult[]> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10${GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : ''}`
    const response = await fetch(url, { next: { revalidate: 60 } })
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
      headers: { 'Authorization': ISBNDB_API_KEY },
      next: { revalidate: 60 }
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

async function searchOpenLibrary(query: string): Promise<BookResult[]> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`
    const response = await fetch(url, { next: { revalidate: 60 } })
    const data = await response.json()
    
    if (!data.docs) return []
    
    return data.docs.map((doc: any) => ({
      id: `ol-${doc.key}`,
      title: doc.title,
      author: doc.author_name?.join(', ') || null,
      isbn: doc.isbn?.[0] || null,
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      source: 'openlibrary' as const
    }))
  } catch (error) {
    console.error('Open Library search error:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Search all sources in parallel
  const [googleResults, isbndbResults, openLibraryResults] = await Promise.all([
    searchGoogleBooks(query),
    searchISBNdb(query),
    searchOpenLibrary(query)
  ])

  // Merge and dedupe - prioritize ISBNdb, then Google, then Open Library
  const seen = new Set<string>()
  const results: BookResult[] = []

  const addResults = (books: BookResult[]) => {
    for (const book of books) {
      // Create dedup key from ISBN or normalized title+author
      const key = book.isbn || `${book.title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${(book.author || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`
      if (!seen.has(key) && book.title) {
        seen.add(key)
        results.push(book)
      }
    }
  }

  addResults(isbndbResults)
  addResults(googleResults)
  addResults(openLibraryResults)

  return NextResponse.json({ 
    results: results.slice(0, 10),
    sources: { 
      google: googleResults.length, 
      isbndb: isbndbResults.length,
      openlibrary: openLibraryResults.length 
    }
  })
}

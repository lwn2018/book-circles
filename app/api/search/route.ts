import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// External API search functions
async function searchGoogleBooks(query: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )
    const data = await response.json()
    
    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title || '',
      author: item.volumeInfo.authors?.join(', ') || '',
      isbn: item.volumeInfo.industryIdentifiers?.find((id: any) => 
        id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier || null,
      cover_url: item.volumeInfo.imageLinks?.thumbnail || null,
      source: 'google'
    }))
  } catch (error) {
    console.error('Google Books API error:', error)
    return []
  }
}

async function searchOpenLibrary(query: string) {
  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`,
      { next: { revalidate: 3600 } }
    )
    const data = await response.json()
    
    return (data.docs || []).slice(0, 10).map((doc: any) => ({
      id: doc.key,
      title: doc.title || '',
      author: doc.author_name?.join(', ') || '',
      isbn: doc.isbn?.[0] || null,
      cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      source: 'openlibrary'
    }))
  } catch (error) {
    console.error('Open Library API error:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  const includeExternal = searchParams.get('external') === 'true'

  if (query.length < 2) {
    return NextResponse.json({
      myLibrary: [],
      myCircles: [],
      external: [],
      query
    })
  }

  try {
    // Search user's own books (full-text search)
    const { data: myBooks } = await supabase
      .rpc('search_my_books', {
        search_query: query,
        user_id: user.id
      })

    // Search books in user's circles (not owned by them)
    const { data: circleBooks } = await supabase
      .rpc('search_circle_books', {
        search_query: query,
        user_id: user.id
      })

    const myLibraryResults = myBooks || []
    const myCirclesResults = circleBooks || []
    const totalInternal = myLibraryResults.length + myCirclesResults.length

    // If low internal results and external search requested, search external APIs
    let externalResults: any[] = []
    if (includeExternal && totalInternal < 5) {
      // Try Google Books first
      const googleResults = await searchGoogleBooks(query)
      externalResults = googleResults

      // If Google returns fewer than 3, try Open Library too
      if (googleResults.length < 3) {
        const openLibResults = await searchOpenLibrary(query)
        externalResults = [...googleResults, ...openLibResults].slice(0, 10)
      }
    }

    return NextResponse.json({
      myLibrary: myLibraryResults,
      myCircles: myCirclesResults,
      external: externalResults,
      query,
      totalInternal
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}

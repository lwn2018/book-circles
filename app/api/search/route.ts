// ALTERNATIVE: Direct query version (no stored procedures)
// Use this if search functions aren't working

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

async function searchGoogleBooks(query: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`,
      { next: { revalidate: 3600 } }
    )
    const data = await response.json()
    
    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title || '',
      author: item.volumeInfo.authors?.join(', ') || '',
      isbn: item.volumeInfo.industryIdentifiers?.find((id: any) => 
        id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier || null,
      cover_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
      // NEW: Rich metadata for database
      genres: item.volumeInfo.categories || [],
      description: item.volumeInfo.description || null,
      page_count: item.volumeInfo.pageCount || null,
      published_date: item.volumeInfo.publishedDate || null,
      publisher: item.volumeInfo.publisher || null,
      language: item.volumeInfo.language || 'en',
      google_books_id: item.id,
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

  if (query.length < 3) {
    return NextResponse.json({
      myLibrary: [],
      myCircles: [],
      external: [],
      query
    })
  }

  try {
    // Search user's own books (direct query with ILIKE)
    const { data: myBooks, error: myBooksError } = await supabase
      .from('books')
      .select('id, title, author, isbn, cover_url, status, gift_on_borrow, current_borrower_id')
      .eq('owner_id', user.id)
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .limit(20)

    if (myBooksError) {
      console.error('My books search error:', myBooksError)
    }

    // Get circles for user's books
    const myBooksWithCircles = await Promise.all(
      (myBooks || []).map(async (book) => {
        const { data: visibilityData } = await supabase
          .from('book_circle_visibility')
          .select('circle_id, is_visible, circles(id, name)')
          .eq('book_id', book.id)
          .eq('is_visible', true)

        const circles = (visibilityData || [])
          .filter(v => v.circles)
          .map(v => ({
            id: (v.circles as any).id,
            name: (v.circles as any).name
          }))

        return { ...book, circles }
      })
    )

    // Search books in user's circles (not owned by them)
    // First get user's circles
    const { data: userCircles } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', user.id)

    const circleIds = userCircles?.map(c => c.circle_id) || []

    let circleBooks: any[] = []
    if (circleIds.length > 0) {
      const { data, error: circleBooksError } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          isbn,
          cover_url,
          status,
          gift_on_borrow,
          owner_id,
          circle_id,
          profiles!books_owner_id_fkey (
            id,
            full_name
          ),
          circles!books_circle_id_fkey (
            id,
            name
          )
        `)
        .in('circle_id', circleIds)
        .neq('owner_id', user.id)
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .limit(20)

      if (circleBooksError) {
        console.error('Circle books search error:', circleBooksError)
      } else {
        // Check visibility
        const filteredBooks = []
        for (const book of data || []) {
          // Check if book is visible in this circle (opt-out model)
          const { data: visibility } = await supabase
            .from('book_circle_visibility')
            .select('is_visible')
            .eq('book_id', book.id)
            .eq('circle_id', book.circle_id)
            .single()

          // If no visibility record or is_visible = true, include it
          if (!visibility || visibility.is_visible !== false) {
            // Get all circles this book is visible in
            const { data: allCircles } = await supabase
              .from('book_circle_visibility')
              .select('circle_id, is_visible, circles(id, name)')
              .eq('book_id', book.id)
              .eq('is_visible', true)
              .in('circle_id', circleIds) // Only user's circles

            const circles = (allCircles || [])
              .filter(v => v.circles)
              .map(v => ({
                id: (v.circles as any).id,
                name: (v.circles as any).name
              }))

            filteredBooks.push({
              ...book,
              owner_name: (book.profiles as any)?.full_name || 'Someone',
              circle_name: (book.circles as any)?.name || 'Unknown',
              circles
            })
          }
        }
        circleBooks = filteredBooks
      }
    }

    const myLibraryResults = myBooksWithCircles || []
    const myCirclesResults = circleBooks
    const totalInternal = myLibraryResults.length + myCirclesResults.length

    console.log('Direct query search results:', {
      query,
      userId: user.id,
      myBooksCount: myLibraryResults.length,
      circleBooksCount: myCirclesResults.length,
      circleIds
    })

    // External search if needed
    let externalResults: any[] = []
    if (includeExternal && totalInternal < 5) {
      const googleResults = await searchGoogleBooks(query)
      externalResults = googleResults

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

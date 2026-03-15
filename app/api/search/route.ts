import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// ============ DATA CLEANING UTILITIES ============

function cleanTitle(title: string): string {
  if (!title) return ''
  return title
    .replace(/\bby\s+by\b/gi, 'by')
    .replace(/\s+by\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s*$/i, '')
    .trim()
}

function cleanAuthor(author: string | null): string {
  if (!author) return ''
  const parts = author.split(/,\s*|\s+and\s+/i).map(p => p.trim()).filter(Boolean)
  const normalizedAuthors = parts.map(name => {
    if (name.includes(',')) {
      const [last, first] = name.split(',').map(p => p.trim())
      if (first && last) return `${first} ${last}`
    }
    return name
  })
  const seen = new Set<string>()
  return normalizedAuthors.filter(name => {
    const lower = name.toLowerCase()
    if (seen.has(lower)) return false
    seen.add(lower)
    return true
  }).join(', ')
}

function computeRelevanceScore(title: string, author: string, query: string): number {
  const queryLower = query.toLowerCase().trim()
  const titleLower = title.toLowerCase().trim()
  const authorLower = (author || '').toLowerCase().trim()
  
  if (titleLower === queryLower) return 1000
  if (titleLower.startsWith(queryLower)) return 800 + Math.max(0, 100 - (titleLower.length - queryLower.length))
  if (titleLower.includes(queryLower)) return 500 + Math.max(0, 100 - (titleLower.length - queryLower.length))
  if (authorLower.includes(queryLower)) return 300
  
  const queryWords = queryLower.split(/\s+/)
  const titleWords = titleLower.split(/\s+/)
  const matchingWords = queryWords.filter(qw => titleWords.some(tw => tw.includes(qw) || qw.includes(tw)))
  if (matchingWords.length > 0) return 100 + (matchingWords.length * 10)
  
  return 0
}

function deduplicateResults<T extends { isbn?: string | null; title: string; author?: string | null }>(results: T[]): T[] {
  const byIsbn = new Map<string, T[]>()
  const noIsbn: T[] = []
  
  for (const result of results) {
    if (result.isbn && result.isbn.length >= 10) {
      const key = result.isbn.replace(/-/g, '')
      if (!byIsbn.has(key)) byIsbn.set(key, [])
      byIsbn.get(key)!.push(result)
    } else {
      noIsbn.push(result)
    }
  }
  
  const dedupedByIsbn: T[] = []
  for (const [, group] of byIsbn) {
    if (group.length === 1) {
      dedupedByIsbn.push(group[0])
    } else {
      const sorted = group.sort((a, b) => {
        if (a.title.length !== b.title.length) return a.title.length - b.title.length
        return (a.author || '').split(',').length - (b.author || '').split(',').length
      })
      dedupedByIsbn.push(sorted[0])
    }
  }
  
  const seenTitleAuthor = new Set<string>()
  const dedupedNoIsbn: T[] = []
  for (const result of noIsbn) {
    const key = `${result.title.toLowerCase()}|${(result.author || '').toLowerCase()}`
    if (!seenTitleAuthor.has(key)) {
      seenTitleAuthor.add(key)
      dedupedNoIsbn.push(result)
    }
  }
  
  const isbnTitles = new Set(dedupedByIsbn.map(r => r.title.toLowerCase()))
  return [...dedupedByIsbn, ...dedupedNoIsbn.filter(r => !isbnTitles.has(r.title.toLowerCase()))]
}

// ============ EXTERNAL SEARCH ============

async function searchGoogleBooks(query: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=15&orderBy=relevance`,
      { next: { revalidate: 3600 } }
    )
    const data = await response.json()
    
    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: cleanTitle(item.volumeInfo.title || ''),
      author: cleanAuthor(item.volumeInfo.authors?.join(', ') || ''),
      isbn: item.volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || 
            item.volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier || null,
      cover_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
      genres: item.volumeInfo.categories || [],
      description: item.volumeInfo.description || null,
      page_count: item.volumeInfo.pageCount || null,
      published_date: item.volumeInfo.publishedDate || null,
      publisher: item.volumeInfo.publisher || null,
      language: item.volumeInfo.language || 'en',
      google_books_id: item.id,
      source: 'google' as const
    }))
  } catch (error) {
    console.error('Google Books API error:', error)
    return []
  }
}

// ============ MAIN HANDLER ============

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
    return NextResponse.json({ myLibrary: [], myCircles: [], external: [], query })
  }

  try {
    // 1. Search user's own books
    const { data: myBooks } = await supabase
      .from('books')
      .select('id, title, author, isbn, cover_url, status, gift_on_borrow, current_borrower_id')
      .eq('owner_id', user.id)
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .limit(30)

    // Get circles for user's own books
    const myBooksWithCircles = await Promise.all(
      (myBooks || []).map(async (book) => {
        const { data: visibilityData } = await supabase
          .from('book_circle_visibility')
          .select('circles(id, name)')
          .eq('book_id', book.id)
          .eq('is_visible', true)

        const circles = (visibilityData || [])
          .filter(v => v.circles)
          .map(v => ({ id: (v.circles as any).id, name: (v.circles as any).name }))

        return { ...book, title: cleanTitle(book.title), author: cleanAuthor(book.author), circles }
      })
    )

    // 2. Get user's circles
    const { data: userCircles } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', user.id)

    const circleIds = userCircles?.map(c => c.circle_id) || []

    // 3. Find books visible in user's circles (via book_circle_visibility)
    let circleBooks: any[] = []
    if (circleIds.length > 0) {
      // First, get book IDs that are visible in user's circles
      const { data: visibleBookIds } = await supabase
        .from('book_circle_visibility')
        .select('book_id')
        .in('circle_id', circleIds)
        .eq('is_visible', true)

      const bookIds = [...new Set(visibleBookIds?.map(v => v.book_id) || [])]

      if (bookIds.length > 0) {
        // Now search within those books (excluding user's own)
        const { data: books, error } = await supabase
          .from('books')
          .select(`
            id, title, author, isbn, cover_url, status, gift_on_borrow, owner_id,
            profiles!books_owner_id_fkey (id, full_name)
          `)
          .in('id', bookIds)
          .neq('owner_id', user.id)
          .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
          .limit(30)

        if (error) {
          console.error('Circle books search error:', error)
        } else {
          // Get circle info for each book
          circleBooks = await Promise.all(
            (books || []).map(async (book) => {
              const { data: bookCircles } = await supabase
                .from('book_circle_visibility')
                .select('circles(id, name)')
                .eq('book_id', book.id)
                .eq('is_visible', true)
                .in('circle_id', circleIds)

              const circles = (bookCircles || [])
                .filter(v => v.circles)
                .map(v => ({ id: (v.circles as any).id, name: (v.circles as any).name }))

              return {
                ...book,
                title: cleanTitle(book.title),
                author: cleanAuthor(book.author),
                owner_name: (book.profiles as any)?.full_name || 'Someone',
                circles
              }
            })
          )
        }
      }
    }

    // Deduplicate and rank
    let myLibraryResults = deduplicateResults(myBooksWithCircles || [])
    let myCirclesResults = deduplicateResults(circleBooks)

    myLibraryResults.sort((a, b) => 
      computeRelevanceScore(b.title, b.author || '', query) - 
      computeRelevanceScore(a.title, a.author || '', query)
    )
    myCirclesResults.sort((a, b) => 
      computeRelevanceScore(b.title, b.author || '', query) - 
      computeRelevanceScore(a.title, a.author || '', query)
    )

    const totalInternal = myLibraryResults.length + myCirclesResults.length

    // External search if needed
    let externalResults: any[] = []
    if (includeExternal && totalInternal < 5) {
      const googleResults = await searchGoogleBooks(query)
      externalResults = deduplicateResults(googleResults)
      externalResults.sort((a, b) => 
        computeRelevanceScore(b.title, b.author || '', query) - 
        computeRelevanceScore(a.title, a.author || '', query)
      )
      externalResults = externalResults.slice(0, 10)
    }

    return NextResponse.json({
      myLibrary: myLibraryResults.slice(0, 20),
      myCircles: myCirclesResults.slice(0, 20),
      external: externalResults,
      query,
      totalInternal
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 })
  }
}

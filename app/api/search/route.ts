import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// ============ DATA CLEANING UTILITIES ============

/**
 * Clean title: remove "by [Author]" patterns, doubled words, etc.
 */
function cleanTitle(title: string): string {
  if (!title) return ''
  
  let cleaned = title
    // Remove "by by" doubled words
    .replace(/\bby\s+by\b/gi, 'by')
    // Remove trailing "by [Author Name]" pattern (captures "by John Smith" at end)
    .replace(/\s+by\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s*$/i, '')
    // Remove leading/trailing whitespace
    .trim()
  
  return cleaned
}

/**
 * Clean author: deduplicate names, normalize "LastName, FirstName" to "FirstName LastName"
 */
function cleanAuthor(author: string | null): string {
  if (!author) return ''
  
  // Split by comma or " and " to handle multiple authors
  const parts = author.split(/,\s*|\s+and\s+/i).map(p => p.trim()).filter(Boolean)
  
  // Normalize each author name
  const normalizedAuthors = parts.map(name => {
    // Check for "LastName, FirstName" format
    if (name.includes(',')) {
      const [last, first] = name.split(',').map(p => p.trim())
      if (first && last) {
        return `${first} ${last}`
      }
    }
    return name
  })
  
  // Deduplicate (case-insensitive)
  const seen = new Set<string>()
  const uniqueAuthors = normalizedAuthors.filter(name => {
    const lower = name.toLowerCase()
    if (seen.has(lower)) return false
    seen.add(lower)
    return true
  })
  
  return uniqueAuthors.join(', ')
}

/**
 * Compute relevance score for ranking
 * Higher = more relevant
 */
function computeRelevanceScore(title: string, author: string, query: string): number {
  const queryLower = query.toLowerCase().trim()
  const titleLower = title.toLowerCase().trim()
  const authorLower = (author || '').toLowerCase().trim()
  
  // Tier 1: Exact title match (score 1000)
  if (titleLower === queryLower) {
    return 1000
  }
  
  // Tier 2: Title starts with query (score 800 - bonus for shorter titles)
  if (titleLower.startsWith(queryLower)) {
    // Prefer shorter titles (closer to query length)
    const lengthBonus = Math.max(0, 100 - (titleLower.length - queryLower.length))
    return 800 + lengthBonus
  }
  
  // Tier 3: Title contains query (score 500 - bonus for shorter titles)
  if (titleLower.includes(queryLower)) {
    const lengthBonus = Math.max(0, 100 - (titleLower.length - queryLower.length))
    return 500 + lengthBonus
  }
  
  // Tier 4: Author match (score 300)
  if (authorLower.includes(queryLower)) {
    return 300
  }
  
  // Tier 5: Partial word matches (score 100)
  const queryWords = queryLower.split(/\s+/)
  const titleWords = titleLower.split(/\s+/)
  const matchingWords = queryWords.filter(qw => 
    titleWords.some(tw => tw.includes(qw) || qw.includes(tw))
  )
  if (matchingWords.length > 0) {
    return 100 + (matchingWords.length * 10)
  }
  
  return 0
}

/**
 * Deduplicate results by ISBN-13, keeping cleanest data
 */
function deduplicateResults<T extends { isbn?: string | null; title: string; author?: string | null }>(
  results: T[]
): T[] {
  const byIsbn = new Map<string, T[]>()
  const noIsbn: T[] = []
  
  // Group by ISBN
  for (const result of results) {
    if (result.isbn && result.isbn.length >= 10) {
      const key = result.isbn.replace(/-/g, '')
      if (!byIsbn.has(key)) byIsbn.set(key, [])
      byIsbn.get(key)!.push(result)
    } else {
      noIsbn.push(result)
    }
  }
  
  // For each ISBN group, pick the cleanest entry
  const dedupedByIsbn: T[] = []
  for (const [, group] of byIsbn) {
    if (group.length === 1) {
      dedupedByIsbn.push(group[0])
    } else {
      // Pick the one with shortest title (likely cleanest) and single author
      const sorted = group.sort((a, b) => {
        const aTitle = a.title.length
        const bTitle = b.title.length
        if (aTitle !== bTitle) return aTitle - bTitle
        
        const aAuthorCount = (a.author || '').split(',').length
        const bAuthorCount = (b.author || '').split(',').length
        return aAuthorCount - bAuthorCount
      })
      dedupedByIsbn.push(sorted[0])
    }
  }
  
  // Deduplicate no-ISBN results by exact title + author
  const seenTitleAuthor = new Set<string>()
  const dedupedNoIsbn: T[] = []
  for (const result of noIsbn) {
    const key = `${result.title.toLowerCase()}|${(result.author || '').toLowerCase()}`
    if (!seenTitleAuthor.has(key)) {
      seenTitleAuthor.add(key)
      dedupedNoIsbn.push(result)
    }
  }
  
  // Also check no-ISBN against ISBN results
  const isbnTitles = new Set(dedupedByIsbn.map(r => r.title.toLowerCase()))
  const finalNoIsbn = dedupedNoIsbn.filter(r => !isbnTitles.has(r.title.toLowerCase()))
  
  return [...dedupedByIsbn, ...finalNoIsbn]
}

// ============ EXTERNAL SEARCH ============

async function searchGoogleBooks(query: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=15&orderBy=relevance`,
      { next: { revalidate: 3600 } }
    )
    const data = await response.json()
    
    return (data.items || []).map((item: any) => {
      const rawTitle = item.volumeInfo.title || ''
      const rawAuthor = item.volumeInfo.authors?.join(', ') || ''
      
      return {
        id: item.id,
        title: cleanTitle(rawTitle),
        author: cleanAuthor(rawAuthor),
        isbn: item.volumeInfo.industryIdentifiers?.find((id: any) => 
          id.type === 'ISBN_13'
        )?.identifier || item.volumeInfo.industryIdentifiers?.find((id: any) => 
          id.type === 'ISBN_10'
        )?.identifier || null,
        cover_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        genres: item.volumeInfo.categories || [],
        description: item.volumeInfo.description || null,
        page_count: item.volumeInfo.pageCount || null,
        published_date: item.volumeInfo.publishedDate || null,
        publisher: item.volumeInfo.publisher || null,
        language: item.volumeInfo.language || 'en',
        google_books_id: item.id,
        source: 'google' as const
      }
    })
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
    
    return (data.docs || []).slice(0, 10).map((doc: any) => {
      const rawTitle = doc.title || ''
      const rawAuthor = doc.author_name?.join(', ') || ''
      
      return {
        id: doc.key,
        title: cleanTitle(rawTitle),
        author: cleanAuthor(rawAuthor),
        isbn: doc.isbn?.[0] || null,
        cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
        source: 'openlibrary' as const
      }
    })
  } catch (error) {
    console.error('Open Library API error:', error)
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
    return NextResponse.json({
      myLibrary: [],
      myCircles: [],
      external: [],
      query
    })
  }

  try {
    // Search user's own books
    const { data: myBooks, error: myBooksError } = await supabase
      .from('books')
      .select('id, title, author, isbn, cover_url, status, gift_on_borrow, current_borrower_id')
      .eq('owner_id', user.id)
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .limit(30)

    if (myBooksError) console.error('My books search error:', myBooksError)

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
          .map(v => ({ id: (v.circles as any).id, name: (v.circles as any).name }))

        return {
          ...book,
          title: cleanTitle(book.title),
          author: cleanAuthor(book.author),
          circles
        }
      })
    )

    // Search books in user's circles (not owned by them)
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
          id, title, author, isbn, cover_url, status, gift_on_borrow, owner_id, circle_id,
          profiles!books_owner_id_fkey (id, full_name),
          circles!books_circle_id_fkey (id, name)
        `)
        .in('circle_id', circleIds)
        .neq('owner_id', user.id)
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .limit(30)

      if (circleBooksError) {
        console.error('Circle books search error:', circleBooksError)
      } else {
        const filteredBooks = []
        for (const book of data || []) {
          const { data: visibility } = await supabase
            .from('book_circle_visibility')
            .select('is_visible')
            .eq('book_id', book.id)
            .eq('circle_id', book.circle_id)
            .single()

          if (!visibility || visibility.is_visible !== false) {
            const { data: allCircles } = await supabase
              .from('book_circle_visibility')
              .select('circle_id, is_visible, circles(id, name)')
              .eq('book_id', book.id)
              .eq('is_visible', true)
              .in('circle_id', circleIds)

            const circles = (allCircles || [])
              .filter(v => v.circles)
              .map(v => ({ id: (v.circles as any).id, name: (v.circles as any).name }))

            filteredBooks.push({
              ...book,
              title: cleanTitle(book.title),
              author: cleanAuthor(book.author),
              owner_name: (book.profiles as any)?.full_name || 'Someone',
              circle_name: (book.circles as any)?.name || 'Unknown',
              circles
            })
          }
        }
        circleBooks = filteredBooks
      }
    }

    // Deduplicate and rank local results
    let myLibraryResults = deduplicateResults(myBooksWithCircles || [])
    let myCirclesResults = deduplicateResults(circleBooks)

    // Sort by relevance
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
      
      // Deduplicate and rank external results
      let allExternal = deduplicateResults(googleResults)
      
      if (allExternal.length < 3) {
        const openLibResults = await searchOpenLibrary(query)
        allExternal = deduplicateResults([...allExternal, ...openLibResults])
      }
      
      // Sort by relevance
      allExternal.sort((a, b) => 
        computeRelevanceScore(b.title, b.author || '', query) - 
        computeRelevanceScore(a.title, a.author || '', query)
      )
      
      externalResults = allExternal.slice(0, 10)
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

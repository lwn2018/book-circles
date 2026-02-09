'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BookCover from './BookCover'

type SearchResult = {
  id: string
  title: string
  author: string | null
  isbn: string | null
  cover_url: string | null
  status?: string
  owner_name?: string
  circle_name?: string
  source?: 'google' | 'openlibrary'
}

export default function BookSearch({ userId }: { userId: string }) {
  const [query, setQuery] = useState('')
  const [myLibrary, setMyLibrary] = useState<SearchResult[]>([])
  const [myCircles, setMyCircles] = useState<SearchResult[]>([])
  const [external, setExternal] = useState<SearchResult[]>([])
  const [searchingInternal, setSearchingInternal] = useState(false)
  const [searchingExternal, setSearchingExternal] = useState(false)
  const [addingBook, setAddingBook] = useState<string | null>(null)
  
  const internalTimerRef = useRef<NodeJS.Timeout | null>(null)
  const externalTimerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Debounced internal search (300ms)
  const searchInternal = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setMyLibrary([])
      setMyCircles([])
      return
    }

    setSearchingInternal(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      setMyLibrary(data.myLibrary || [])
      setMyCircles(data.myCircles || [])

      // Trigger external search if few internal results
      if (data.totalInternal < 5 && searchQuery.length >= 3) {
        searchExternal(searchQuery)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearchingInternal(false)
    }
  }, [])

  // Debounced external search (500ms)
  const searchExternal = useCallback(async (searchQuery: string) => {
    setSearchingExternal(true)
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&external=true`
      )
      const data = await response.json()
      setExternal(data.external || [])
    } catch (error) {
      console.error('External search error:', error)
    } finally {
      setSearchingExternal(false)
    }
  }, [])

  // Handle input changes with debouncing
  useEffect(() => {
    // Clear previous timers
    if (internalTimerRef.current) clearTimeout(internalTimerRef.current)
    if (externalTimerRef.current) clearTimeout(externalTimerRef.current)

    if (query.length < 2) {
      setMyLibrary([])
      setMyCircles([])
      setExternal([])
      return
    }

    // Debounce internal search (300ms)
    internalTimerRef.current = setTimeout(() => {
      searchInternal(query)
    }, 300)

    return () => {
      if (internalTimerRef.current) clearTimeout(internalTimerRef.current)
      if (externalTimerRef.current) clearTimeout(externalTimerRef.current)
    }
  }, [query, searchInternal])

  const handleAddToLibrary = async (book: SearchResult) => {
    setAddingBook(book.id)
    try {
      const { error } = await supabase
        .from('books')
        .insert({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          cover_url: book.cover_url,
          owner_id: userId,
          status: 'available'
        })

      if (error) throw error

      alert(`Added "${book.title}" to your library!`)
      router.refresh()
      
      // Re-search to update results
      searchInternal(query)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setAddingBook(null)
    }
  }

  const getBuyAmazonLink = (book: SearchResult) => {
    const affiliateTag = 'pagepass-20' // From spec
    
    if (book.isbn) {
      return `https://www.amazon.ca/dp/${book.isbn}?tag=${affiliateTag}`
    }
    
    // Fallback to search
    const searchQuery = encodeURIComponent(`${book.title} ${book.author || ''}`.trim())
    return `https://www.amazon.ca/s?k=${searchQuery}&tag=${affiliateTag}`
  }

  const totalResults = myLibrary.length + myCircles.length + external.length

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for books by title or author..."
          className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute left-4 top-3.5 text-gray-400 text-xl">🔍</span>
        {searchingInternal && (
          <span className="absolute right-4 top-3.5 text-sm text-gray-500">
            Searching...
          </span>
        )}
      </div>

      {/* Results */}
      {query.length >= 2 && (
        <div className="space-y-6">
          {/* My Library */}
          {myLibrary.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">📚 In Your Library ({myLibrary.length})</h3>
              <div className="grid gap-3">
                {myLibrary.map((book) => (
                  <BookCard key={book.id} book={book} type="own" />
                ))}
              </div>
            </div>
          )}

          {/* My Circles */}
          {myCircles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">🏘️ In Your Circles ({myCircles.length})</h3>
              <div className="grid gap-3">
                {myCircles.map((book) => (
                  <BookCard key={book.id} book={book} type="circle" />
                ))}
              </div>
            </div>
          )}

          {/* External Results */}
          {external.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">🌐 Not in Your Circles ({external.length})</h3>
              {searchingExternal && (
                <p className="text-sm text-gray-500 mb-2">Searching beyond your circles...</p>
              )}
              <div className="grid gap-3">
                {external.map((book) => (
                  <div key={book.id} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4">
                    {/* Cover */}
                    <BookCover
                      coverUrl={book.cover_url}
                      title={book.title}
                      author={book.author}
                      isbn={book.isbn}
                      className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
                    />

                    {/* Details */}
                    <div className="flex-1">
                      <h4 className="font-semibold">{book.title}</h4>
                      {book.author && (
                        <p className="text-sm text-gray-600">by {book.author}</p>
                      )}
                      {book.isbn && (
                        <p className="text-xs text-gray-400 mt-1">ISBN: {book.isbn}</p>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAddToLibrary(book)}
                          disabled={addingBook === book.id}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {addingBook === book.id ? 'Adding...' : '+ Add to Library'}
                        </button>
                        <a
                          href={getBuyAmazonLink(book)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
                        >
                          🛒 Buy on Amazon
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalResults === 0 && !searchingInternal && !searchingExternal && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">No books found for "{query}"</p>
              <p className="text-sm text-gray-500">
                Try a different search or{' '}
                <a 
                  href={getBuyAmazonLink({ id: '', title: query, author: null, isbn: null, cover_url: null })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  browse on Amazon
                </a>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// BookCard subcomponent for internal results
function BookCard({ book, type }: { book: SearchResult; type: 'own' | 'circle' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4">
      {/* Cover */}
      <BookCover
        coverUrl={book.cover_url}
        title={book.title}
        author={book.author}
        isbn={book.isbn}
        className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
      />

      {/* Details */}
      <div className="flex-1">
        <h4 className="font-semibold">{book.title}</h4>
        {book.author && (
          <p className="text-sm text-gray-600">by {book.author}</p>
        )}
        
        {/* Status/Owner Info */}
        <div className="mt-2 space-y-1">
          {type === 'own' && book.status && (
            <p className="text-xs text-gray-600">
              Status: {book.status === 'available' ? '✅ Available' : 
                       book.status === 'borrowed' ? '📖 Lent Out' : 
                       book.status}
            </p>
          )}
          {type === 'circle' && (
            <>
              {book.owner_name && (
                <p className="text-xs text-gray-600">Owner: {book.owner_name}</p>
              )}
              {book.circle_name && (
                <p className="text-xs text-gray-600">Circle: {book.circle_name}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

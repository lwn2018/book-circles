'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import BooksList from './BooksList'
import BooksListView from './BooksListView'
import FilterBar from './FilterBar'

// Detect iOS Safari
const isIOSSafari = () => {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const webkit = /WebKit/.test(ua)
  const noChrome = !/CriOS|Chrome/.test(ua)
  return iOS && webkit && noChrome
}

type Book = {
  id: string
  title: string
  author: string | null
  isbn: string | null
  cover_url: string | null
  status: string
  gift_on_borrow?: boolean
  owner: { full_name: string } | null
  current_borrower: { full_name: string } | null
  owner_id: string
  current_borrower_id: string | null
  due_date: string | null
  created_at: string
  book_queue?: any[]
}

type BooksListWithFiltersProps = {
  books: Book[]
  userId: string
  circleId: string
  circleMemberIds: string[]
  defaultBrowseView?: string
}

export default function BooksListWithFilters({
  books: initialBooks,
  userId,
  circleId,
  circleMemberIds,
  defaultBrowseView = 'card'
}: BooksListWithFiltersProps) {
  const [books, setBooks] = useState(initialBooks)
  const [sortBy, setSortBy] = useState('recently_added')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [displayCount, setDisplayCount] = useState(20)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [useFixedPosition, setUseFixedPosition] = useState(false)
  const [filterBarHeight, setFilterBarHeight] = useState(0)
  const filterBarRef = useRef<HTMLDivElement | null>(null)
  const searchParams = useSearchParams()
  const [searchFilter, setSearchFilter] = useState('')
  const [toast, setToast] = useState<{message: string; type: 'success' | 'info'} | null>(null)
  const [sessionModifiedBooks, setSessionModifiedBooks] = useState<Set<string>>(new Set())
  
  // Update local state when server data changes (on navigation)
  useEffect(() => {
    setBooks(initialBooks)
    setSessionModifiedBooks(new Set()) // Clear session modifications on navigation
  }, [initialBooks])

  // Handle book status updates without re-sorting
  const updateBookStatus = (bookId: string, updates: Partial<Book>, toastMessage?: string) => {
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId ? { ...book, ...updates } : book
      )
    )
    // Mark this book as modified in this session (don't re-sort it)
    setSessionModifiedBooks(prev => new Set(prev).add(bookId))
    
    if (toastMessage) {
      setToast({ message: toastMessage, type: 'success' })
      setTimeout(() => setToast(null), 4000)
    }
  }

  // Read URL search parameter on mount (from SearchOverlay circle tags)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setSearchFilter(q)
    }
  }, [searchParams])

  // Detect iOS Safari for fixed positioning workaround
  useEffect(() => {
    setUseFixedPosition(isIOSSafari())
  }, [])

  // Measure filter bar height for wrapper min-height (prevents content jump)
  useEffect(() => {
    if (filterBarRef.current) {
      const height = filterBarRef.current.offsetHeight
      setFilterBarHeight(height)
    }
  }, [sortBy, availableOnly]) // Re-measure if bar size changes

  // Load view preference from user settings
  useEffect(() => {
    setViewMode(defaultBrowseView as 'card' | 'list')
  }, [defaultBrowseView])

  // Change view mode (temporarily for this session, doesn't persist)
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode)
  }

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    // If we have session-modified books, don't re-sort at all - keep current order
    if (sessionModifiedBooks.size > 0) {
      let result = [...books]
      
      // Apply filters only
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase()
        result = result.filter(book => 
          book.title.toLowerCase().includes(query) ||
          (book.author?.toLowerCase() || '').includes(query)
        )
      }

      if (availableOnly) {
        result = result.filter(book => book.status === 'available')
      }
      
      return result
    }
    
    // No session modifications - sort normally
    let result = [...books]

    // Apply search filter from URL parameter
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase()
      result = result.filter(book => 
        book.title.toLowerCase().includes(query) ||
        (book.author?.toLowerCase() || '').includes(query)
      )
    }

    // Apply available only filter
    if (availableOnly) {
      result = result.filter(book => book.status === 'available')
    }

    // Sort
    switch (sortBy) {
      case 'title_asc':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'title_desc':
        result.sort((a, b) => b.title.localeCompare(a.title))
        break
      case 'most_requested':
        // Sort by queue length (most requested first)
        result.sort((a, b) => {
          const aQueue = a.book_queue?.length || 0
          const bQueue = b.book_queue?.length || 0
          return bQueue - aQueue
        })
        break
      case 'recently_added':
      default:
        // Default: Other people's available > Own available > Borrowed > Off Shelf
        result.sort((a, b) => {
          const aIsOwn = a.owner_id === userId
          const bIsOwn = b.owner_id === userId
          const aStatus = a.status
          const bStatus = b.status
          
          // Priority order (lower number = higher priority)
          const getPriority = (book: typeof a) => {
            if (book.status === 'available' && book.owner_id !== userId) return 1 // Others' available
            if (book.status === 'available' && book.owner_id === userId) return 2 // Own available
            if (book.status === 'borrowed' || book.status === 'in_transit') return 3 // Borrowed
            if (book.status === 'off_shelf') return 4 // Off shelf
            return 5 // Unknown
          }
          
          const aPriority = getPriority(a)
          const bPriority = getPriority(b)
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority
          }
          
          // Same priority group, sort by created_at descending (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        break
    }

    return result
  }, [books, searchFilter, availableOnly, sortBy, userId, sessionModifiedBooks])

  // Paginated books (for infinite scroll)
  const displayedBooks = useMemo(() => {
    return filteredAndSortedBooks.slice(0, displayCount)
  }, [filteredAndSortedBooks, displayCount])

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      // Check if user scrolled near bottom
      const scrolledToBottom = 
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500

      if (scrolledToBottom && displayCount < filteredAndSortedBooks.length) {
        setDisplayCount(prev => Math.min(prev + 20, filteredAndSortedBooks.length))
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [displayCount, filteredAndSortedBooks.length])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20)
  }, [searchFilter, availableOnly, sortBy])

  // Get most recent books for "New in circle" section
  const newBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
  }, [books])

  return (
    <div>
      {/* New in this circle */}
      {newBooks.length > 0 && (
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-semibold mb-2">New in this circle</h3>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto -mx-1 px-1">
            {newBooks.map(book => {
              const inQueue = book.book_queue?.some(q => q.user_id === userId)
              const isOwner = book.owner_id === userId
              const isBorrower = book.current_borrower_id === userId
              
              return (
                <div key={book.id} className="flex-shrink-0 w-36 sm:w-40 bg-white rounded-lg shadow-sm p-2 sm:p-3 border border-gray-200">
                  {book.cover_url ? (
                    <img 
                      src={book.cover_url} 
                      alt={book.title}
                      className={`w-full h-44 sm:h-48 object-cover rounded shadow-sm transition-opacity ${
                        book.status === 'available' ? 'opacity-100' : 
                        book.status === 'off_shelf' ? 'opacity-50' : 
                        'opacity-70'
                      }`}
                    />
                  ) : (
                    <div className={`w-full h-44 sm:h-48 bg-gray-200 rounded flex items-center justify-center transition-opacity ${
                      book.status === 'available' ? 'opacity-100' : 
                      book.status === 'off_shelf' ? 'opacity-50' : 
                      'opacity-70'
                    }`}>
                      <span className="text-3xl sm:text-4xl">📚</span>
                    </div>
                  )}
                  <p className="text-xs font-medium mt-2 truncate">{book.title}</p>
                  {book.author && (
                    <p className="text-xs text-gray-600 truncate mb-2">{book.author}</p>
                  )}
                  
                  {/* Status badge */}
                  <div className="mb-2">
                    {book.status === 'available' ? (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded inline-block">Available</span>
                    ) : book.status === 'borrowed' ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded inline-block">Borrowed</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded inline-block">Off Shelf</span>
                    )}
                  </div>
                  
                  {/* Action button */}
                  {!isOwner && book.status === 'available' && (
                    <button
                      onClick={() => {
                        // Find the book in the main list to use the full handler
                        const fullBook = books.find(b => b.id === book.id)
                        if (fullBook) {
                          window.location.href = `#book-${book.id}` // Scroll to book in main list
                        }
                      }}
                      className="w-full text-xs px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800"
                    >
                      Borrow
                    </button>
                  )}
                  {!isOwner && book.status === 'borrowed' && !isBorrower && !inQueue && (
                    <button
                      onClick={() => {
                        window.location.href = `#book-${book.id}`
                      }}
                      className="w-full text-xs px-2 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 active:bg-purple-800"
                    >
                      Join Queue
                    </button>
                  )}
                  {inQueue && (
                    <span className="w-full text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded block text-center">
                      In Queue
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FilterBar wrapper - preserves height when sticky to prevent content jump */}
      <div style={{ minHeight: filterBarHeight > 0 ? `${filterBarHeight}px` : 'auto' }}>
        <div ref={filterBarRef}>
          <FilterBar
            sortBy={sortBy}
            onSortChange={setSortBy}
            availableOnly={availableOnly}
            onAvailableOnlyChange={setAvailableOnly}
            totalBooks={books.length}
            filteredCount={filteredAndSortedBooks.length}
          />
        </div>
      </div>

      {/* Content below filter bar - add padding-top only on iOS Safari (fixed positioning) */}
      <div className={useFixedPosition ? 'pt-32' : ''}>
        {/* Search filter indicator (from URL parameter) */}
        {searchFilter && (
          <div className="mb-2 mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm text-blue-700">
                Searching for: <strong>"{searchFilter}"</strong>
              </span>
            </div>
            <button
              onClick={() => setSearchFilter('')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        )}

        {/* View Toggle - Mobile Optimized */}
        <div className="flex justify-end gap-2 mb-2 mt-3">
          <button
            onClick={() => handleViewModeChange('card')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${
              viewMode === 'card'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Card
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            List
          </button>
        </div>

        <div className="min-h-screen">
        {viewMode === 'card' ? (
          <BooksList 
            books={displayedBooks}
            userId={userId}
            circleId={circleId}
            circleMemberIds={circleMemberIds}
            onBookUpdate={updateBookStatus}
          />
        ) : (
          <BooksListView 
            books={displayedBooks}
            userId={userId}
            circleId={circleId}
            circleMemberIds={circleMemberIds}
            onBookUpdate={updateBookStatus}
          />
        )}

        {/* Loading indicator when more books are available */}
        {displayCount < filteredAndSortedBooks.length && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600 mt-2">Loading more books...</p>
          </div>
        )}

        {/* No more books indicator */}
        {displayCount >= filteredAndSortedBooks.length && filteredAndSortedBooks.length > 20 && (
          <div className="text-center py-8 text-sm text-gray-500">
            You've reached the end • {filteredAndSortedBooks.length} books shown
          </div>
        )}

        {/* No results */}
        {filteredAndSortedBooks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No books found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-md text-center animate-fade-in">
          {toast.message}
        </div>
      )}
    </div>
  )
}

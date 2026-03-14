'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import BooksList from './BooksList'
import BooksListView from './BooksListView'
import FilterBar from './FilterBar'
import RequestConfirmationDialog from '@/app/components/RequestConfirmationDialog'

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'borrowed' | 'in_queue'>('all')
  const [displayCount, setDisplayCount] = useState(20)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const searchParams = useSearchParams()
  const [searchFilter, setSearchFilter] = useState('')
  const [toast, setToast] = useState<{message: string; type: 'success' | 'info'} | null>(null)
  const [sessionModifiedBooks, setSessionModifiedBooks] = useState<Set<string>>(new Set())
  const [requestingBookId, setRequestingBookId] = useState<string | null>(null)
  
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
    // Apply filter based on active filter
    const applyStatusFilter = (result: Book[]) => {
      switch (activeFilter) {
        case 'available':
          return result.filter(book => book.status === 'available')
        case 'borrowed':
          return result.filter(book => book.status === 'borrowed' || book.status === 'in_transit')
        case 'in_queue':
          return result.filter(book => book.book_queue?.some(q => q.user_id === userId))
        default:
          return result
      }
    }

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

      result = applyStatusFilter(result)
      
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

    // Apply status filter
    result = applyStatusFilter(result)

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
  }, [books, searchFilter, activeFilter, sortBy, userId, sessionModifiedBooks])

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
  }, [searchFilter, activeFilter, sortBy])

  // Get most recent books for "New in circle" section
  const newBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [books])

  return (
    <div>
      {/* New in this circle - Horizontal scroll carousel */}
      {newBooks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 font-arimo">New in this circle</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {newBooks.map(book => {
              const inQueue = book.book_queue?.some(q => q.user_id === userId)
              const isOwner = book.owner_id === userId
              const isBorrower = book.current_borrower_id === userId
              
              return (
                <div 
                  key={book.id} 
                  className="flex-shrink-0 w-32 sm:w-36"
                >
                  {/* Book Cover */}
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#27272A] shadow-lg mb-2">
                    {book.cover_url ? (
                      <img 
                        src={book.cover_url} 
                        alt={book.title}
                        className={`w-full h-full object-cover transition-opacity ${
                          book.status === 'available' ? 'opacity-100' : 
                          book.status === 'off_shelf' ? 'opacity-50' : 
                          'opacity-70'
                        }`}
                      />
                    ) : (
                      <div className={`w-full h-full bg-[#3F3F46] flex items-center justify-center transition-opacity ${
                        book.status === 'available' ? 'opacity-100' : 
                        book.status === 'off_shelf' ? 'opacity-50' : 
                        'opacity-70'
                      }`}>
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                    
                    {/* Status badge overlay */}
                    <div className="absolute bottom-2 left-2 right-2">
                      {book.status === 'available' ? (
                        <span className="text-xs bg-green-600/90 text-white px-2 py-1 rounded-full inline-block backdrop-blur-sm">
                          Available
                        </span>
                      ) : book.status === 'borrowed' ? (
                        <span className="text-xs bg-yellow-600/90 text-white px-2 py-1 rounded-full inline-block backdrop-blur-sm">
                          Borrowed
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-600/90 text-white px-2 py-1 rounded-full inline-block backdrop-blur-sm">
                          Off Shelf
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Book Info */}
                  <p className="text-sm font-medium text-white line-clamp-2 leading-tight mb-1">{book.title}</p>
                  {book.author && (
                    <p className="text-xs text-gray-400 truncate mb-2">{book.author}</p>
                  )}
                  
                  {/* Action button */}
                  {!isOwner && book.status === 'available' && (
                    <button
                      onClick={() => setRequestingBookId(book.id)}
                      className="w-full text-xs px-3 py-2 bg-[#55B2DE] text-white rounded-lg font-medium hover:bg-[#4A9FCB] active:scale-95 transition-all"
                    >
                      Borrow
                    </button>
                  )}
                  {!isOwner && book.status === 'borrowed' && !isBorrower && !inQueue && (
                    <button
                      onClick={() => setRequestingBookId(book.id)}
                      className="w-full text-xs px-3 py-2 bg-[#3F3F46] text-white rounded-lg font-medium hover:bg-[#52525B] active:scale-95 transition-all"
                    >
                      Join Queue
                    </button>
                  )}
                  {inQueue && (
                    <span className="w-full text-xs px-3 py-2 bg-purple-600/20 text-purple-300 rounded-lg block text-center border border-purple-500/30">
                      In Queue
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FilterBar */}
      <FilterBar
        sortBy={sortBy}
        onSortChange={setSortBy}
        availableOnly={availableOnly}
        onAvailableOnlyChange={setAvailableOnly}
        totalBooks={books.length}
        filteredCount={filteredAndSortedBooks.length}
      />

      {/* Content below filter bar */}
      <div>
        {/* Search filter indicator (from URL parameter) */}
        {searchFilter && (
          <div className="mb-3 mt-3 px-3 py-2 bg-[#27272A] border border-[#3F3F46] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm text-gray-300">
                Searching for: <strong className="text-white">"{searchFilter}"</strong>
              </span>
            </div>
            <button
              onClick={() => setSearchFilter('')}
              className="text-[#55B2DE] hover:text-[#6BC4EC] text-sm font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* View Toggle - Dark theme */}
        <div className="flex justify-end gap-2 mb-4 mt-4">
          <button
            onClick={() => handleViewModeChange('card')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              viewMode === 'card'
                ? 'bg-[#55B2DE] text-white'
                : 'bg-[#27272A] text-gray-300 hover:bg-[#3F3F46]'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              viewMode === 'list'
                ? 'bg-[#55B2DE] text-white'
                : 'bg-[#27272A] text-gray-300 hover:bg-[#3F3F46]'
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#55B2DE]"></div>
            <p className="text-sm text-gray-400 mt-2">Loading more books...</p>
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
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">No books found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
      </div>

      {/* Toast notification - Dark theme */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#55B2DE] text-white px-4 py-3 rounded-lg shadow-lg max-w-md text-center animate-fade-in">
          {toast.message}
        </div>
      )}

      {/* Request/Borrow Confirmation Dialog for New Books carousel */}
      {requestingBookId && (
        <RequestConfirmationDialog
          bookId={requestingBookId}
          onClose={() => setRequestingBookId(null)}
          onSuccess={(result) => {
            setRequestingBookId(null)
            
            if (result.action === 'borrow') {
              updateBookStatus(
                requestingBookId,
                {
                  status: 'in_transit',
                  current_borrower_id: userId,
                  current_borrower: { full_name: 'You' }
                },
                result.message
              )
            } else {
              // Request/queue action
              setToast({ message: result.message, type: 'success' })
              setTimeout(() => setToast(null), 4000)
            }
          }}
        />
      )}
    </div>
  )
}

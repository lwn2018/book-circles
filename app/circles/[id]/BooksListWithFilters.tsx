'use client'

import { useState, useMemo, useEffect } from 'react'
import BooksList from './BooksList'
import BooksListView from './BooksListView'
import FilterBar from './FilterBar'

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
}

export default function BooksListWithFilters({
  books,
  userId,
  circleId,
  circleMemberIds
}: BooksListWithFiltersProps) {
  const [sortBy, setSortBy] = useState('recently_added')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [displayCount, setDisplayCount] = useState(20)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  // Load view preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('books_view_mode')
    if (saved === 'card' || saved === 'list') {
      setViewMode(saved)
    }
  }, [])

  // Save view preference
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('books_view_mode', mode)
  }

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let result = [...books]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
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
        // Default: Available > Borrowed > Off Shelf, then by created_at desc within each group
        const statusOrder: Record<string, number> = {
          'available': 1,
          'borrowed': 2,
          'in_transit': 2,
          'off_shelf': 3
        }
        result.sort((a, b) => {
          const aStatus = statusOrder[a.status] || 4
          const bStatus = statusOrder[b.status] || 4
          
          if (aStatus !== bStatus) {
            return aStatus - bStatus
          }
          
          // Same status, sort by created_at descending (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        break
    }

    return result
  }, [books, searchQuery, availableOnly, sortBy])

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
  }, [searchQuery, availableOnly, sortBy])

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
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3">New in this circle</h3>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-1 px-1">
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

      <FilterBar
        sortBy={sortBy}
        onSortChange={setSortBy}
        availableOnly={availableOnly}
        onAvailableOnlyChange={setAvailableOnly}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalBooks={books.length}
        filteredCount={filteredAndSortedBooks.length}
      />

      {/* View Toggle - Mobile Optimized */}
      <div className="flex justify-end gap-2 mt-3 sm:mt-4 mb-3 sm:mb-4">
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

      <div>
        {viewMode === 'card' ? (
          <BooksList 
            books={displayedBooks}
            userId={userId}
            circleId={circleId}
            circleMemberIds={circleMemberIds}
          />
        ) : (
          <BooksListView 
            books={displayedBooks}
            userId={userId}
            circleId={circleId}
            circleMemberIds={circleMemberIds}
          />
        )}
      </div>

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
  )
}

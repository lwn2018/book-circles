'use client'

import { useState, useMemo, useEffect } from 'react'
import BooksList from './BooksList'
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

  return (
    <div>
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

      <div className="mt-4">
        <BooksList 
          books={displayedBooks}
          userId={userId}
          circleId={circleId}
          circleMemberIds={circleMemberIds}
        />
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

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
  owner_id: string
  current_borrower_id: string | null
  due_date: string | null
  created_at: string
  owner: { full_name: string } | null
  current_borrower: { full_name: string } | null
  book_queue?: Array<{
    id: string
    user_id: string
    position: number
    pass_count?: number
    last_pass_reason?: string | null
    profiles: { full_name: string } | null
  }>
}

type BooksListWithFiltersProps = {
  books: Book[]
  userId: string
  circleId: string
  circleMemberIds: string[]
  defaultBrowseView?: 'card' | 'list'
}

export default function BooksListWithFilters({
  books,
  userId,
  circleId,
  circleMemberIds,
  defaultBrowseView = 'card'
}: BooksListWithFiltersProps) {
  const searchParams = useSearchParams()
  const [sortBy, setSortBy] = useState('recently_added')
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'borrowed' | 'in_queue'>('all')
  const [displayCount, setDisplayCount] = useState(20)
  const [searchFilter, setSearchFilter] = useState('')

  // Handle search param from URL
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setSearchFilter(q)
    }
  }, [searchParams])

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
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

    let result = [...books]

    // Apply search filter
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase()
      result = result.filter(book => 
        book.title.toLowerCase().includes(query) ||
        (book.author && book.author.toLowerCase().includes(query))
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
        result.sort((a, b) => (b.book_queue?.length || 0) - (a.book_queue?.length || 0))
        break
      default:
        // Default: Other people's available > Own available > Borrowed > Off Shelf
        result.sort((a, b) => {
          const getPriority = (book: typeof a) => {
            if (book.status === 'available' && book.owner_id !== userId) return 1
            if (book.status === 'available' && book.owner_id === userId) return 2
            if (book.status === 'borrowed' || book.status === 'in_transit') return 3
            if (book.status === 'off_shelf') return 4
            return 5
          }

          const aPriority = getPriority(a)
          const bPriority = getPriority(b)

          if (aPriority !== bPriority) {
            return aPriority - bPriority
          }

          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        break
    }

    return result
  }, [books, searchFilter, activeFilter, sortBy, userId])

  // Paginated books
  const displayedBooks = useMemo(() => {
    return filteredAndSortedBooks.slice(0, displayCount)
  }, [filteredAndSortedBooks, displayCount])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolledToBottom = 
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200
      
      if (scrolledToBottom && displayCount < filteredAndSortedBooks.length) {
        setDisplayCount(prev => prev + 20)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [displayCount, filteredAndSortedBooks.length])

  return (
    <div>
      {/* Filter Bar */}
      <FilterBar
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalBooks={books.length}
        filteredCount={filteredAndSortedBooks.length}
      />

      {/* Books List - uses global browse view preference */}
      <BooksList
        books={displayedBooks}
        userId={userId}
        circleId={circleId}
        circleMemberIds={circleMemberIds}
        viewMode={defaultBrowseView}
      />

      {/* Load more indicator */}
      {displayCount < filteredAndSortedBooks.length && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">Scroll for more...</p>
        </div>
      )}
    </div>
  )
}

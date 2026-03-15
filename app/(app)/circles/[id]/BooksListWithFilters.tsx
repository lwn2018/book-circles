'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import BooksList from './BooksList'

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

const filters = [
  { key: 'all', label: 'All Books' },
  { key: 'available', label: 'Available' },
  { key: 'borrowed', label: 'Borrowed' },
  { key: 'in_queue', label: 'In Queue' },
] as const

export default function BooksListWithFilters({
  books,
  userId,
  circleId,
  circleMemberIds,
  defaultBrowseView = 'card'
}: BooksListWithFiltersProps) {
  const searchParams = useSearchParams()
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

  // Filter books
  const filteredBooks = useMemo(() => {
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
    switch (activeFilter) {
      case 'available':
        result = result.filter(book => book.status === 'available')
        break
      case 'borrowed':
        result = result.filter(book => book.status === 'borrowed' || book.status === 'in_transit')
        break
      case 'in_queue':
        result = result.filter(book => book.book_queue?.some(q => q.user_id === userId))
        break
    }

    // Sort: Other people's available > Own available > Borrowed > Off Shelf
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
      if (aPriority !== bPriority) return aPriority - bPriority
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [books, searchFilter, activeFilter, userId])

  // Paginated books
  const displayedBooks = useMemo(() => {
    return filteredBooks.slice(0, displayCount)
  }, [filteredBooks, displayCount])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolledToBottom = 
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200
      
      if (scrolledToBottom && displayCount < filteredBooks.length) {
        setDisplayCount(prev => prev + 20)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [displayCount, filteredBooks.length])

  return (
    <div>
      {/* Filter pills only - no dropdown, no view toggle, no count */}
      <div className="flex gap-2 overflow-x-auto pb-5 -mx-4 px-4 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              activeFilter === filter.key
                ? 'bg-[#55B2DE] text-white'
                : 'bg-[#1E293B] text-[#94A3B8] border border-[#334155] hover:bg-[#334155]'
            }`}
            style={{ fontFamily: 'var(--font-figtree)', fontSize: '14px', fontWeight: 500 }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Books List - 20px gap from pills is handled by pb-5 above */}
      <BooksList
        books={displayedBooks}
        userId={userId}
        circleId={circleId}
        circleMemberIds={circleMemberIds}
      />

      {/* Load more indicator */}
      {displayCount < filteredBooks.length && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">Scroll for more...</p>
        </div>
      )}
    </div>
  )
}

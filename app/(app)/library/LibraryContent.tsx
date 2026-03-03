'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import LibraryBookCard from './LibraryBookCard'

type Book = {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  isbn: string | null
  status: string
  gift_on_borrow?: boolean
  current_holder?: { id: string; full_name: string }
  visibility: Array<{ circle_id: string; is_visible: boolean }>
}

type Circle = {
  id: string
  name: string
}

type FilterTab = 'all' | 'on_shelf' | 'lent_out' | 'off_shelf'

export default function LibraryContent({
  books,
  circles,
  userId,
  defaultBrowseView = 'card'
}: {
  books: Book[]
  circles: Circle[]
  userId: string
  defaultBrowseView?: string
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  // Filter books based on search and active filter
  const filteredBooks = useMemo(() => {
    let result = books

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(book =>
        book.title.toLowerCase().includes(query) ||
        (book.author && book.author.toLowerCase().includes(query))
      )
    }

    // Apply status filter
    switch (activeFilter) {
      case 'on_shelf':
        result = result.filter(b => b.status === 'available')
        break
      case 'lent_out':
        result = result.filter(b => b.status === 'borrowed' || b.status === 'in_transit' || b.status === 'ready_for_next')
        break
      case 'off_shelf':
        result = result.filter(b => b.status === 'off_shelf')
        break
      default:
        // 'all' - no filter
        break
    }

    return result
  }, [books, searchQuery, activeFilter])

  // Count books in each category
  const counts = useMemo(() => ({
    all: books.length,
    on_shelf: books.filter(b => b.status === 'available').length,
    lent_out: books.filter(b => b.status === 'borrowed' || b.status === 'in_transit' || b.status === 'ready_for_next').length,
    off_shelf: books.filter(b => b.status === 'off_shelf').length
  }), [books])

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'on_shelf', label: 'On Shelf' },
    { key: 'lent_out', label: 'Lent Out' },
    { key: 'off_shelf', label: 'Off Shelf' }
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Library</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {books.length} {books.length === 1 ? 'book' : 'books'}
          </p>
        </div>
        
        {/* Import Button */}
        <Link
          href="/library/import"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#27272A] hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <span>📥</span>
          <span className="hidden sm:inline">Import</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search your library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[#27272A] text-white placeholder-zinc-500 rounded-xl border border-transparent focus:border-orange-500 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? 'bg-orange-500 text-white'
                : 'bg-[#27272A] text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 ${activeFilter === tab.key ? 'text-orange-100' : 'text-zinc-500'}`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Books Grid or Empty State */}
      {books.length === 0 ? (
        <EmptyLibraryState />
      ) : filteredBooks.length === 0 ? (
        <NoResultsState searchQuery={searchQuery} activeFilter={activeFilter} />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          {filteredBooks.map((book) => (
            <LibraryBookCard
              key={book.id}
              book={book}
              userCircles={circles}
              userId={userId}
            />
          ))}
        </div>
      )}
    </>
  )
}

function EmptyLibraryState() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📚</div>
      <h2 className="text-xl font-bold text-white mb-2">Your library is empty</h2>
      <p className="text-zinc-400 mb-6 max-w-md mx-auto">
        Start building your library by adding books you own and are willing to share with your circles.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/library/import"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <span>📥</span>
          Import from Goodreads
        </Link>
      </div>
    </div>
  )
}

function NoResultsState({ searchQuery, activeFilter }: { searchQuery: string; activeFilter: FilterTab }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">🔍</div>
      <h2 className="text-lg font-bold text-white mb-2">No books found</h2>
      <p className="text-zinc-400">
        {searchQuery
          ? `No books matching "${searchQuery}"`
          : `No books in this category`}
      </p>
    </div>
  )
}

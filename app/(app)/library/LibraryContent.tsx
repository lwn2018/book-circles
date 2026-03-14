'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

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

type FilterTab = 'all' | 'on_shelf' | 'lent_out'

// Color hash for placeholder covers
const COVER_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6']
function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i)
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length]
}

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
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  // Filter books based on active filter
  const filteredBooks = useMemo(() => {
    switch (activeFilter) {
      case 'on_shelf':
        return books.filter(b => b.status === 'available')
      case 'lent_out':
        return books.filter(b => b.status === 'borrowed' || b.status === 'in_transit' || b.status === 'ready_for_next')
      default:
        return books
    }
  }, [books, activeFilter])

  // Stats counts
  const totalBooks = books.length
  const onShelfCount = books.filter(b => b.status === 'available').length
  const lentOutCount = books.filter(b => b.status === 'borrowed' || b.status === 'in_transit' || b.status === 'ready_for_next').length

  return (
    <div>
      {/* Page Title */}
      <h1 
        className="text-2xl font-bold text-white mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        My Library
      </h1>
      <p 
        className="text-[#9CA3AF] mb-6"
        style={{ fontFamily: 'var(--font-figtree)', fontSize: '14px' }}
      >
        Track and manage your book
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#1E293B] rounded-xl p-4">
          <div className="flex items-start justify-between">
            <span 
              className="text-white text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {totalBooks}
            </span>
            <svg className="w-6 h-6 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p 
            className="text-[#9CA3AF] mt-1"
            style={{ fontFamily: 'var(--font-figtree)', fontSize: '12px' }}
          >
            Total Books
          </p>
        </div>

        <div className="bg-[#1E293B] rounded-xl p-4">
          <div className="flex items-start justify-between">
            <span 
              className="text-white text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {onShelfCount}
            </span>
            <svg className="w-6 h-6 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <p 
            className="text-[#9CA3AF] mt-1"
            style={{ fontFamily: 'var(--font-figtree)', fontSize: '12px' }}
          >
            On Shelf
          </p>
        </div>

        <div className="bg-[#1E293B] rounded-xl p-4">
          <div className="flex items-start justify-between">
            <span 
              className="text-white text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {lentOutCount}
            </span>
            <svg className="w-6 h-6 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p 
            className="text-[#9CA3AF] mt-1"
            style={{ fontFamily: 'var(--font-figtree)', fontSize: '12px' }}
          >
            Lent Out
          </p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-[#55B2DE] text-white'
              : 'bg-transparent text-[#9CA3AF]'
          }`}
          style={{ fontFamily: 'var(--font-figtree)' }}
        >
          All Books
        </button>
        <button
          onClick={() => setActiveFilter('on_shelf')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            activeFilter === 'on_shelf'
              ? 'bg-[#55B2DE] text-white'
              : 'bg-transparent text-[#9CA3AF]'
          }`}
          style={{ fontFamily: 'var(--font-figtree)' }}
        >
          On Shelf
        </button>
        <button
          onClick={() => setActiveFilter('lent_out')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            activeFilter === 'lent_out'
              ? 'bg-[#55B2DE] text-white'
              : 'bg-transparent text-[#9CA3AF]'
          }`}
          style={{ fontFamily: 'var(--font-figtree)' }}
        >
          Lent Out
        </button>
      </div>

      {/* Books List - Empty State */}
      {books.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-white mb-2">Your library is empty</h2>
          <p className="text-[#9CA3AF] mb-6 max-w-md mx-auto">
            Start building your library by adding books you own.
          </p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-lg font-bold text-white mb-2">No books found</h2>
          <p className="text-[#9CA3AF]">No books in this category</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBooks.map((book) => {
            // Determine status badge
            let badgeText = ''
            let badgeColor = ''
            let statusLine = ''
            
            if (book.status === 'available') {
              badgeText = 'On Shelf'
              badgeColor = '#32D74B'
            } else if (book.status === 'in_transit') {
              badgeText = book.current_holder ? `Passing to ${book.current_holder.full_name.split(' ')[0]}` : 'In Transit'
              badgeColor = '#F7B14B'
              statusLine = 'Waiting for confirmation'
            } else if (book.status === 'borrowed' || book.status === 'ready_for_next') {
              badgeText = book.current_holder ? `Lent to ${book.current_holder.full_name.split(' ')[0]}` : 'Lent Out'
              badgeColor = '#F7B14B'
              statusLine = book.current_holder ? `Currently with ${book.current_holder.full_name.split(' ')[0]}` : ''
            } else if (book.status === 'off_shelf') {
              badgeText = 'Off Shelf'
              badgeColor = '#6B7280'
            }

            return (
              <Link 
                key={book.id} 
                href={`/books/${book.id}`}
                className="block"
              >
                <div className="bg-[#1E293B] rounded-xl p-3 flex gap-[14px] items-start min-h-[130px]">
                  {/* Book cover - larger for library */}
                  <div 
                    className="flex-shrink-0 w-[80px] h-[120px] rounded-md overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: book.cover_url ? '#2A3441' : hashColor(book.title) }}
                  >
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="text-white text-[10px] font-medium text-center px-1 line-clamp-3">
                        {book.title}
                      </span>
                    )}
                  </div>

                  {/* Content area */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {/* Status badge */}
                    <span 
                      className="inline-flex items-center self-start px-3 py-1 rounded-full mb-2"
                      style={{ 
                        fontFamily: 'var(--font-inter)', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        backgroundColor: `${badgeColor}20`,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}40`
                      }}
                    >
                      {badgeText}
                    </span>

                    {/* Book title */}
                    <h3 
                      className="text-white line-clamp-2 mb-1"
                      style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 600 }}
                    >
                      {book.title}
                    </h3>

                    {/* Author */}
                    {book.author && (
                      <p 
                        className="text-[#9CA3AF] truncate mb-1"
                        style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 500 }}
                      >
                        {book.author}
                      </p>
                    )}

                    {/* Status line */}
                    {statusLine && (
                      <p 
                        className="text-[#55B2DE] text-xs mt-1"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        {statusLine}
                      </p>
                    )}
                  </div>

                  {/* Chevron */}
                  <div className="flex-shrink-0 flex items-center h-full">
                    <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

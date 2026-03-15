'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

type BooksListProps = {
  books: Book[]
  userId: string
  circleId: string
  circleMemberIds: string[]
  viewMode?: 'card' | 'list'
}

// Simple color hash for placeholder backgrounds
const COVER_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6']
function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i)
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length]
}

// Status badge colors per brief
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: '#1A4A2A', text: '#4ADE80' },
  borrowed: { bg: '#2A2A1A', text: '#FACC15' },
  queued: { bg: '#1A2A3A', text: '#94A3B8' },
  overdue: { bg: '#3A1A1A', text: '#F87171' },
  gift: { bg: '#3A1A2A', text: '#EC4899' },
  in_transit: { bg: '#1A2A3A', text: '#55B2DE' },
  off_shelf: { bg: '#2A2A2A', text: '#6B7280' },
}

export default function BooksList({ books, userId, circleId, circleMemberIds, viewMode = 'card' }: BooksListProps) {
  const router = useRouter()
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null)

  const handleBorrow = async (e: React.MouseEvent, book: Book) => {
    e.preventDefault()
    e.stopPropagation()
    
    setLoadingBookId(book.id)
    try {
      const res = await fetch(`/api/books/${book.id}/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to borrow')
      }
    } catch (err) {
      console.error('Borrow failed:', err)
      alert('Failed to borrow book')
    } finally {
      setLoadingBookId(null)
    }
  }

  const handleJoinQueue = async (e: React.MouseEvent, book: Book) => {
    e.preventDefault()
    e.stopPropagation()
    
    setLoadingBookId(book.id)
    try {
      const res = await fetch(`/api/books/${book.id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to join queue')
      }
    } catch (err) {
      console.error('Join queue failed:', err)
      alert('Failed to join queue')
    } finally {
      setLoadingBookId(null)
    }
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400" style={{ fontFamily: 'var(--font-figtree)' }}>
          No books found
        </p>
      </div>
    )
  }

  // Helper to get status info for a book
  const getBookStatus = (book: Book) => {
    const isOwner = book.owner_id === userId
    const isBorrower = book.current_borrower_id === userId
    const borrowerName = book.current_borrower?.full_name?.split(' ')[0] || 'someone'
    const inQueue = book.book_queue?.some(q => q.user_id === userId)
    const queuePosition = book.book_queue?.find(q => q.user_id === userId)?.position

    let badgeText = ''
    let statusKey = ''
    let showBorrowButton = false
    let showJoinQueueButton = false
    let showInQueueBadge = false

    if (book.status === 'off_shelf') {
      badgeText = 'Off Shelf'
      statusKey = 'off_shelf'
    } else if (book.status === 'available') {
      badgeText = book.gift_on_borrow ? '🎁 Gift' : 'Available'
      statusKey = book.gift_on_borrow ? 'gift' : 'available'
    } else if (book.status === 'in_transit') {
      badgeText = 'In Transit'
      statusKey = 'in_transit'
    } else if (isBorrower) {
      badgeText = 'Reading'
      statusKey = 'borrowed'
    } else if (isOwner && book.current_borrower) {
      badgeText = `Lent`
      statusKey = 'borrowed'
    } else {
      badgeText = 'Borrowed'
      statusKey = 'borrowed'
    }

    if (!isOwner && !isBorrower) {
      if (book.status === 'available') {
        showBorrowButton = true
      } else if (book.status === 'borrowed' || book.status === 'in_transit') {
        if (inQueue) {
          showInQueueBadge = true
        } else {
          showJoinQueueButton = true
        }
      }
    }

    return { badgeText, statusKey, showBorrowButton, showJoinQueueButton, showInQueueBadge, queuePosition, isOwner, isBorrower }
  }

  // LIST VIEW - Compact rows (76px height, 6-8 visible)
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col">
        {books.map((book, index) => {
          const status = getBookStatus(book)
          const colors = STATUS_COLORS[status.statusKey] || STATUS_COLORS.borrowed
          const isLoading = loadingBookId === book.id

          return (
            <Link 
              key={book.id} 
              href={`/books/${book.id}`}
              className="block"
            >
              <div 
                className="flex items-center gap-3 px-4 h-[76px]"
                style={{ 
                  borderBottom: index < books.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                }}
              >
                {/* Cover thumbnail - 44x64px */}
                <div 
                  className="flex-shrink-0 w-[44px] h-[64px] rounded overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: book.cover_url ? '#2A3441' : hashColor(book.title) }}
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <span className="text-white text-[8px] font-medium text-center px-0.5 line-clamp-3">
                      {book.title}
                    </span>
                  )}
                </div>

                {/* Title + Author - flex grow, truncate */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-medium truncate">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-[#8A94A8] text-xs truncate">
                      {book.author}
                    </p>
                  )}
                </div>

                {/* Actions column - fixed width */}
                <div className="flex-shrink-0 flex items-center gap-2 w-[110px] justify-end">
                  {/* Status badge */}
                  <span 
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {status.badgeText}
                  </span>

                  {/* Action button */}
                  {status.showBorrowButton && (
                    <button
                      onClick={(e) => handleBorrow(e, book)}
                      disabled={isLoading}
                      className="px-3 h-7 bg-[#55B2DE] text-white rounded-full text-[11px] font-semibold hover:bg-[#4A9FCB] disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {isLoading ? '...' : 'Borrow'}
                    </button>
                  )}

                  {status.showJoinQueueButton && (
                    <button
                      onClick={(e) => handleJoinQueue(e, book)}
                      disabled={isLoading}
                      className="px-3 h-7 bg-[#3F3F46] text-white rounded-full text-[11px] font-semibold hover:bg-[#52525B] disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {isLoading ? '...' : 'Request'}
                    </button>
                  )}

                  {status.showInQueueBadge && (
                    <span className="px-2 h-7 flex items-center rounded-full text-[11px] font-semibold bg-[#1A2A3A] text-[#55B2DE] whitespace-nowrap">
                      #{status.queuePosition}
                    </span>
                  )}
                </div>

                {/* Chevron */}
                <svg className="w-4 h-4 text-[#4A5470] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  // CARD VIEW - Original layout
  return (
    <div className="flex flex-col gap-3">
      {books.map((book) => {
        const status = getBookStatus(book)
        const colors = STATUS_COLORS[status.statusKey] || STATUS_COLORS.borrowed
        const isLoading = loadingBookId === book.id

        return (
          <Link 
            key={book.id} 
            href={`/books/${book.id}`}
            className="block"
          >
            {/* Horizontal row card */}
            <div className="bg-[#1E293B] rounded-xl p-3 flex gap-[14px] items-start min-h-[130px]">
              {/* Book cover thumbnail - 64px wide */}
              <div 
                className="flex-shrink-0 w-[64px] h-[96px] rounded-md overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: book.cover_url ? '#2A3441' : hashColor(book.title) }}
              >
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <span className="text-white text-[10px] font-medium text-center px-1 line-clamp-3">
                    {book.title}
                  </span>
                )}
              </div>

              {/* Content area */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Status badge */}
                <span 
                  className="inline-flex items-center self-start px-3 py-1 rounded-full mb-2"
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: 600,
                    backgroundColor: colors.bg,
                    color: colors.text,
                  }}
                >
                  {status.badgeText}
                </span>

                {/* Book title */}
                <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">
                  {book.title}
                </h3>

                {/* Author */}
                {book.author && (
                  <p className="text-[#9CA3AF] text-xs truncate mb-2">
                    {book.author}
                  </p>
                )}

                {/* Action button */}
                {status.showBorrowButton && (
                  <button
                    onClick={(e) => handleBorrow(e, book)}
                    disabled={isLoading}
                    className="self-start px-4 py-1.5 bg-[#55B2DE] text-white rounded-full text-xs font-semibold hover:bg-[#4A9FCB] disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? '...' : 'Borrow'}
                  </button>
                )}

                {status.showJoinQueueButton && (
                  <button
                    onClick={(e) => handleJoinQueue(e, book)}
                    disabled={isLoading}
                    className="self-start px-4 py-1.5 bg-[#3F3F46] text-white rounded-full text-xs font-semibold hover:bg-[#52525B] disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? '...' : 'Join Queue'}
                  </button>
                )}

                {status.showInQueueBadge && (
                  <span className="self-start px-4 py-1.5 rounded-full text-xs font-semibold bg-[#55B2DE20] text-[#55B2DE]">
                    #{status.queuePosition} in queue
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

'use client'

import Link from 'next/link'

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

// Status badge colors per spec
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

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400" style={{ fontFamily: 'var(--font-figtree)' }}>
          No books found
        </p>
      </div>
    )
  }

  // Helper to get status info
  const getBookStatus = (book: Book) => {
    const isOwner = book.owner_id === userId
    const isBorrower = book.current_borrower_id === userId
    const borrowerName = book.current_borrower?.full_name?.split(' ')[0] || 'someone'
    const inQueue = book.book_queue?.some(q => q.user_id === userId)
    const queuePosition = book.book_queue?.find(q => q.user_id === userId)?.position

    let badgeText = ''
    let statusKey = ''

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
      badgeText = `Lent to ${borrowerName}`
      statusKey = 'borrowed'
    } else if (book.current_borrower) {
      badgeText = `Borrowed by ${borrowerName}`
      statusKey = 'borrowed'
    } else {
      badgeText = 'Borrowed'
      statusKey = 'borrowed'
    }

    if (inQueue && queuePosition) {
      badgeText = `#${queuePosition} in queue`
      statusKey = 'queued'
    }

    return { badgeText, statusKey, colors: STATUS_COLORS[statusKey] || STATUS_COLORS.borrowed }
  }

  // LIST VIEW - Compact rows
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-[10px]">
        {books.map((book) => {
          const { badgeText, colors } = getBookStatus(book)

          return (
            <Link key={book.id} href={`/books/${book.id}`} className="block">
              <div className="bg-[#1E293B] rounded-xl p-3 flex items-center gap-3">
                {/* Cover thumbnail - 44x64px */}
                <div 
                  className="flex-shrink-0 w-[44px] h-[64px] rounded overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: book.cover_url ? '#2A3441' : hashColor(book.title) }}
                >
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <span className="text-white text-[8px] font-medium text-center px-0.5 line-clamp-3">{book.title}</span>
                  )}
                </div>

                {/* Text column */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="self-start px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: colors.bg, color: colors.text }}>
                    {badgeText}
                  </span>
                  <h3 className="text-white text-sm font-medium truncate">{book.title}</h3>
                  {book.author && <p className="text-[#8A94A8] text-xs truncate">{book.author}</p>}
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

  // CARD VIEW - Larger cards with more detail
  return (
    <div className="flex flex-col gap-3">
      {books.map((book) => {
        const { badgeText, colors } = getBookStatus(book)

        return (
          <Link key={book.id} href={`/books/${book.id}`} className="block">
            <div className="bg-[#1E293B] rounded-xl p-3 flex gap-[14px] items-start min-h-[130px]">
              {/* Book cover - 64x96px */}
              <div 
                className="flex-shrink-0 w-[64px] h-[96px] rounded-md overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: book.cover_url ? '#2A3441' : hashColor(book.title) }}
              >
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <span className="text-white text-[10px] font-medium text-center px-1 line-clamp-3">{book.title}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="inline-flex items-center self-start px-3 py-1 rounded-full mb-2"
                  style={{ fontSize: '11px', fontWeight: 600, backgroundColor: colors.bg, color: colors.text }}>
                  {badgeText}
                </span>
                <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">{book.title}</h3>
                {book.author && <p className="text-[#9CA3AF] text-xs truncate">{book.author}</p>}
              </div>

              {/* Chevron */}
              <svg className="w-5 h-5 text-[#4A5470] flex-shrink-0 mt-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

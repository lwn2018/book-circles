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

export default function BooksList({ books, userId, circleId, circleMemberIds }: BooksListProps) {

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400" style={{ fontFamily: 'var(--font-figtree)' }}>
          No books found
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[10px]">
      {books.map((book) => {
        const isOwner = book.owner_id === userId
        const isBorrower = book.current_borrower_id === userId
        const borrowerName = book.current_borrower?.full_name?.split(' ')[0] || 'someone'
        const inQueue = book.book_queue?.some(q => q.user_id === userId)
        const queuePosition = book.book_queue?.find(q => q.user_id === userId)?.position

        // Determine status badge text and color
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

        // Show queue position if user is in queue
        if (inQueue && queuePosition) {
          badgeText = `#${queuePosition} in queue`
          statusKey = 'queued'
        }

        const colors = STATUS_COLORS[statusKey] || STATUS_COLORS.borrowed

        return (
          <Link 
            key={book.id} 
            href={`/books/${book.id}`}
            className="block"
          >
            {/* Discrete card - #1E293B background, 12px radius, 12px padding */}
            <div className="bg-[#1E293B] rounded-xl p-3 flex items-center gap-3">
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

              {/* Text column: Status pill, Title, Author - stacked */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                {/* Status pill */}
                <span 
                  className="self-start px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {badgeText}
                </span>

                {/* Title */}
                <h3 className="text-white text-sm font-medium truncate">
                  {book.title}
                </h3>

                {/* Author */}
                {book.author && (
                  <p className="text-[#8A94A8] text-xs truncate">
                    {book.author}
                  </p>
                )}
              </div>

              {/* Chevron - right side */}
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

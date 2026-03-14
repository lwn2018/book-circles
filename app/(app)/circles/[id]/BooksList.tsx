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
    <div className="flex flex-col gap-3">
      {books.map((book) => {
        const isOwner = book.owner_id === userId
        const isBorrower = book.current_borrower_id === userId
        const borrowerName = book.current_borrower?.full_name?.split(' ')[0] || 'someone'
        
        // Determine status badge - transparent bg with colored text
        let badgeText = ''
        let badgeColor = ''
        
        if (book.status === 'off_shelf') {
          badgeText = 'Off Shelf'
          badgeColor = '#6B7280' // gray
        } else if (book.status === 'available') {
          badgeText = 'Available'
          badgeColor = '#32D74B' // green
        } else if (book.status === 'in_transit') {
          badgeText = 'In Transit'
          badgeColor = '#55B2DE' // blue
        } else if (isBorrower) {
          badgeText = 'Borrowed by you'
          badgeColor = '#F7B14B' // amber
        } else if (isOwner && book.current_borrower) {
          badgeText = `Lent to ${borrowerName}`
          badgeColor = '#F7B14B' // amber
        } else if (book.current_borrower) {
          badgeText = `Borrowed by ${borrowerName}`
          badgeColor = '#F7B14B' // amber
        } else {
          badgeText = 'Borrowed'
          badgeColor = '#F7B14B' // amber
        }

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
                    onError={(e) => {
                      // Hide broken image, show colored bg
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
                {/* Status badge - transparent bg with colored text */}
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
                    className="text-[#9CA3AF] truncate"
                    style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 500 }}
                  >
                    {book.author}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

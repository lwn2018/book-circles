'use client'

import Link from 'next/link'
import BookCover from '@/app/components/BookCover'

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
        
        // Determine status badge
        let badgeText = ''
        let badgeStyle = ''
        
        if (book.status === 'off_shelf') {
          badgeText = 'Off Shelf'
          badgeStyle = 'bg-[#6B7280] text-white'
        } else if (book.status === 'available') {
          badgeText = 'Available'
          badgeStyle = 'bg-[#32D74B] text-[#121212]'
        } else if (book.status === 'in_transit') {
          badgeText = 'In Transit'
          badgeStyle = 'bg-[#55B2DE] text-[#121212]'
        } else if (isOwner && book.current_borrower) {
          badgeText = `Lent to ${book.current_borrower.full_name.split(' ')[0]}`
          badgeStyle = 'bg-[#F7B14B] text-[#121212]'
        } else if (isBorrower) {
          badgeText = 'You\'re reading'
          badgeStyle = 'bg-[#F7B14B] text-[#121212]'
        } else if (book.current_borrower) {
          badgeText = 'Borrowed'
          badgeStyle = 'bg-[#F7B14B] text-[#121212]'
        } else {
          badgeText = 'Borrowed'
          badgeStyle = 'bg-[#F7B14B] text-[#121212]'
        }

        return (
          <Link 
            key={book.id} 
            href={`/books/${book.id}`}
            className="block"
          >
            {/* Horizontal row card */}
            <div 
              className="bg-[#1E293B] rounded-xl p-3 flex gap-[14px] items-start"
              style={{ minHeight: '130px' }}
            >
              {/* Book cover thumbnail - 64px wide, 96px tall */}
              <div className="relative flex-shrink-0 w-[64px] h-[96px] rounded-md overflow-hidden bg-[#2A3441]">
                <BookCover
                  coverUrl={book.cover_url}
                  title={book.title}
                  author={book.author}
                  fill={true}
                  sizes="64px"
                  className="object-cover"
                  status={book.status as any}
                />
              </div>

              {/* Content area */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {/* Status badge */}
                <span 
                  className={`inline-flex items-center self-start px-3 py-1 rounded-full mb-2 ${badgeStyle}`}
                  style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 600 }}
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

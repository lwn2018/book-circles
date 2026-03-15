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
}

// Simple color hash for placeholder backgrounds
const COVER_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6']
function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i)
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length]
}

export default function BooksList({ books, userId, circleId, circleMemberIds }: BooksListProps) {
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

  return (
    <div className="flex flex-col gap-3">
      {books.map((book) => {
        const isOwner = book.owner_id === userId
        const isBorrower = book.current_borrower_id === userId
        const borrowerName = book.current_borrower?.full_name?.split(' ')[0] || 'someone'
        const inQueue = book.book_queue?.some(q => q.user_id === userId)
        const queuePosition = book.book_queue?.find(q => q.user_id === userId)?.position
        
        // Determine status badge
        let badgeText = ''
        let badgeColor = ''
        
        if (book.status === 'off_shelf') {
          badgeText = 'Off Shelf'
          badgeColor = '#6B7280'
        } else if (book.status === 'available') {
          badgeText = book.gift_on_borrow ? '🎁 Gift' : 'Available'
          badgeColor = book.gift_on_borrow ? '#EC4899' : '#32D74B'
        } else if (book.status === 'in_transit') {
          badgeText = 'In Transit'
          badgeColor = '#55B2DE'
        } else if (isBorrower) {
          badgeText = 'Borrowed by you'
          badgeColor = '#F7B14B'
        } else if (isOwner && book.current_borrower) {
          badgeText = `Lent to ${borrowerName}`
          badgeColor = '#F7B14B'
        } else if (book.current_borrower) {
          badgeText = `Borrowed by ${borrowerName}`
          badgeColor = '#F7B14B'
        } else {
          badgeText = 'Borrowed'
          badgeColor = '#F7B14B'
        }

        // Determine button to show
        let showBorrowButton = false
        let showJoinQueueButton = false
        let showInQueueBadge = false

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
              <div className="flex-1 min-w-0 flex flex-col">
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
                    className="text-[#9CA3AF] truncate mb-2"
                    style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 500 }}
                  >
                    {book.author}
                  </p>
                )}

                {/* Action button */}
                {showBorrowButton && (
                  <button
                    onClick={(e) => handleBorrow(e, book)}
                    disabled={isLoading}
                    className="self-start px-4 py-1.5 bg-[#55B2DE] text-white rounded-full text-xs font-semibold hover:bg-[#4A9FCB] disabled:opacity-50 transition-colors"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {isLoading ? '...' : 'Borrow'}
                  </button>
                )}

                {showJoinQueueButton && (
                  <button
                    onClick={(e) => handleJoinQueue(e, book)}
                    disabled={isLoading}
                    className="self-start px-4 py-1.5 bg-[#3F3F46] text-white rounded-full text-xs font-semibold hover:bg-[#52525B] disabled:opacity-50 transition-colors"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {isLoading ? '...' : 'Join Queue'}
                  </button>
                )}

                {showInQueueBadge && (
                  <span 
                    className="self-start px-4 py-1.5 rounded-full text-xs font-semibold"
                    style={{ 
                      fontFamily: 'var(--font-inter)',
                      backgroundColor: '#55B2DE20',
                      color: '#55B2DE'
                    }}
                  >
                    #{queuePosition} in queue
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

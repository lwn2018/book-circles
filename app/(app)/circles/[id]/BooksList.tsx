'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { completeGiftTransfer } from '@/lib/gift-actions'

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

const COVER_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6']
function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i)
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length]
}

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
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No books found</p>
      </div>
    )
  }

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

    return { 
      badgeText, 
      statusKey, 
      colors: STATUS_COLORS[statusKey] || STATUS_COLORS.borrowed,
      isOwner,
      isBorrower,
      inQueue,
      isAvailable: book.status === 'available',
      isOffShelf: book.status === 'off_shelf'
    }
  }

  const handleBorrow = async (e: React.MouseEvent, book: Book) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loadingBookId) return
    setLoadingBookId(book.id)

    try {
      // Handle gift books
      if (book.gift_on_borrow) {
        if (!confirm(`${book.owner?.full_name || 'The owner'} is gifting you "${book.title}". Accept this gift?`)) {
          setLoadingBookId(null)
          return
        }
        const result = await completeGiftTransfer(book.id, userId, circleId)
        if (result.error) throw new Error(result.error)
        router.refresh()
        return
      }

      // Regular borrow
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14)

      const { error } = await supabase.from('books').update({
        status: 'borrowed',
        current_borrower_id: userId,
        borrowed_at: new Date().toISOString(),
        due_date: dueDate.toISOString()
      }).eq('id', book.id)

      if (error) throw error

      await supabase.from('borrow_history').insert({
        book_id: book.id,
        borrower_id: userId,
        due_date: dueDate.toISOString()
      })

      router.refresh()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setLoadingBookId(null)
    }
  }

  const handleJoinQueue = async (e: React.MouseEvent, book: Book) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loadingBookId) return
    setLoadingBookId(book.id)

    try {
      // Get current max position
      const { data: queueData } = await supabase
        .from('book_queue')
        .select('position')
        .eq('book_id', book.id)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = (queueData?.[0]?.position || 0) + 1

      const { error } = await supabase.from('book_queue').insert({
        book_id: book.id,
        user_id: userId,
        position: nextPosition
      })

      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setLoadingBookId(null)
    }
  }

  // LIST VIEW
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-[10px]">
        {books.map((book) => {
          const status = getBookStatus(book)
          const showBorrow = !status.isOwner && status.isAvailable && !status.isOffShelf
          const showQueue = !status.isOwner && !status.isAvailable && !status.inQueue && !status.isBorrower && !status.isOffShelf
          const isLoading = loadingBookId === book.id

          return (
            <div key={book.id} className="bg-[#1E293B] rounded-xl p-3 flex items-center gap-3">
              {/* Cover thumbnail */}
              <Link href={`/books/${book.id}`} className="flex-shrink-0">
                <div 
                  className="w-[44px] h-[64px] rounded overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: book.cover_url ? '#2A3441' : hashColor(book.title) }}
                >
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <span className="text-white text-[8px] font-medium text-center px-0.5 line-clamp-3">{book.title}</span>
                  )}
                </div>
              </Link>

              {/* Text column */}
              <Link href={`/books/${book.id}`} className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="self-start px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: status.colors.bg, color: status.colors.text }}>
                  {status.badgeText}
                </span>
                <h3 className="text-white text-sm font-medium truncate">{book.title}</h3>
                {book.author && <p className="text-[#8A94A8] text-xs truncate">{book.author}</p>}
              </Link>

              {/* Action button */}
              {showBorrow && (
                <button
                  onClick={(e) => handleBorrow(e, book)}
                  disabled={isLoading}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-50 ${
                    book.gift_on_borrow 
                      ? 'bg-[#EC4899] text-white hover:bg-[#DB2777]'
                      : 'bg-[#4ADE80] text-[#1A1A1A] hover:bg-[#22C55E]'
                  }`}
                >
                  {isLoading ? '...' : book.gift_on_borrow ? '🎁' : 'Borrow'}
                </button>
              )}
              {showQueue && (
                <button
                  onClick={(e) => handleJoinQueue(e, book)}
                  disabled={isLoading}
                  className="flex-shrink-0 px-3 py-1.5 bg-[#8B5CF6] text-white rounded-full text-xs font-semibold hover:bg-[#7C3AED] transition disabled:opacity-50"
                >
                  {isLoading ? '...' : 'Queue'}
                </button>
              )}
              {!showBorrow && !showQueue && (
                <Link href={`/books/${book.id}`}>
                  <svg className="w-4 h-4 text-[#4A5470] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // CARD VIEW
  return (
    <div className="flex flex-col gap-3">
      {books.map((book) => {
        const status = getBookStatus(book)
        const showBorrow = !status.isOwner && status.isAvailable && !status.isOffShelf
        const showQueue = !status.isOwner && !status.isAvailable && !status.inQueue && !status.isBorrower && !status.isOffShelf
        const isLoading = loadingBookId === book.id

        return (
          <div key={book.id} className="bg-[#1E293B] rounded-xl p-3 flex gap-[14px] items-start min-h-[130px]">
            {/* Book cover */}
            <Link href={`/books/${book.id}`} className="flex-shrink-0">
              <div 
                className="w-[64px] h-[96px] rounded-md overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: book.cover_url ? '#2A3441' : hashColor(book.title) }}
              >
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <span className="text-white text-[10px] font-medium text-center px-1 line-clamp-3">{book.title}</span>
                )}
              </div>
            </Link>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col">
              <span className="inline-flex items-center self-start px-3 py-1 rounded-full mb-2"
                style={{ fontSize: '11px', fontWeight: 600, backgroundColor: status.colors.bg, color: status.colors.text }}>
                {status.badgeText}
              </span>
              <Link href={`/books/${book.id}`}>
                <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1 hover:text-[#55B2DE] transition">{book.title}</h3>
              </Link>
              {book.author && <p className="text-[#9CA3AF] text-xs truncate mb-2">{book.author}</p>}
              
              {/* Action buttons */}
              <div className="flex gap-2 mt-auto">
                {showBorrow && (
                  <button
                    onClick={(e) => handleBorrow(e, book)}
                    disabled={isLoading}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-50 ${
                      book.gift_on_borrow 
                        ? 'bg-[#EC4899] text-white hover:bg-[#DB2777]'
                        : 'bg-[#4ADE80] text-[#1A1A1A] hover:bg-[#22C55E]'
                    }`}
                  >
                    {isLoading ? '...' : book.gift_on_borrow ? '🎁 Accept Gift' : 'Borrow'}
                  </button>
                )}
                {showQueue && (
                  <button
                    onClick={(e) => handleJoinQueue(e, book)}
                    disabled={isLoading}
                    className="px-4 py-1.5 bg-[#8B5CF6] text-white rounded-full text-xs font-semibold hover:bg-[#7C3AED] transition disabled:opacity-50"
                  >
                    {isLoading ? '...' : 'Join Queue'}
                  </button>
                )}
              </div>
            </div>

            {/* Details link */}
            <Link href={`/books/${book.id}`} className="flex-shrink-0 mt-8">
              <svg className="w-5 h-5 text-[#4A5470] hover:text-[#55B2DE] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinQueue, leaveQueue } from '@/lib/queue-actions'
import { completeGiftTransfer } from '@/lib/gift-actions'
import BuyAmazonButton from '@/app/components/BuyAmazonButton'
import { createClient } from '@/lib/supabase'
import BookCover from '@/app/components/BookCover'
import RequestConfirmationDialog from '@/app/components/RequestConfirmationDialog'

type QueueEntry = {
  id: string
  user_id: string
  position: number
  pass_count?: number
  last_pass_reason?: string
  profiles?: { full_name: string }
}

type Book = {
  id: string
  title: string
  author: string | null
  isbn: string | null
  cover_url: string | null
  status: string
  gift_on_borrow?: boolean
  owner: { full_name: string } | null
  current_borrower: { full_name: string } | null
  owner_id: string
  current_borrower_id: string | null
  due_date: string | null
  book_queue?: QueueEntry[]
}

export default function BooksListView({
  books,
  userId,
  circleId,
  circleMemberIds,
  onBookUpdate
}: {
  books: Book[]
  userId: string
  circleId: string
  circleMemberIds: string[]
  onBookUpdate?: (bookId: string, updates: Partial<Book>, toastMessage?: string) => void
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [requestingBookId, setRequestingBookId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleJoinQueue = async (bookId: string) => {
    setLoading(bookId)
    const book = books.find(b => b.id === bookId)
    const result = await joinQueue(bookId, userId)
    setLoading(null)
    if (result.error) {
      alert(result.error)
    } else {
      // Update local state with toast instead of refreshing
      const queuePosition = (book?.book_queue?.length || 0) + 1
      if (onBookUpdate) {
        onBookUpdate(
          bookId,
          {
            book_queue: [
              ...(book?.book_queue || []),
              { 
                id: 'temp', 
                user_id: userId, 
                position: queuePosition,
                profiles: { full_name: 'You' }
              }
            ]
          },
          `You're #${queuePosition} in the queue for "${book?.title}"`
        )
      } else {
        router.refresh()
      }
    }
  }

  const handleLeaveQueue = async (bookId: string) => {
    setLoading(bookId)
    const result = await leaveQueue(bookId, userId)
    setLoading(null)
    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12 bg-[#27272A] rounded-xl">
        <p className="text-gray-400">No books yet. Add your first book!</p>
      </div>
    )
  }

  return (
    <>
    <div className="bg-[#27272A] rounded-xl overflow-hidden">
      {books.map((book, index) => {
        const inQueue = book.book_queue?.some(q => q.user_id === userId)
        
        return (
          <div 
            key={book.id} 
            className={`flex items-center gap-3 px-4 py-3 hover:bg-[#3F3F46] transition-colors ${
              index !== books.length - 1 ? 'border-b border-[#3F3F46]' : ''
            }`}
          >
            {/* Compact Cover */}
            <div className="w-10 h-14 rounded overflow-hidden bg-[#3F3F46] flex-shrink-0">
              {book.cover_url ? (
                <img 
                  src={book.cover_url}
                  alt={book.title}
                  className={`w-full h-full object-cover ${
                    book.status === 'available' ? 'opacity-100' : 
                    book.status === 'off_shelf' ? 'opacity-50' : 
                    'opacity-70'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
              )}
            </div>

            {/* Book Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold font-[Inter] text-sm text-white truncate">{book.title}</h3>
              {book.author && (
                <p className="text-xs text-gray-400 truncate">{book.author}</p>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {book.gift_on_borrow && (
                <span className="text-sm">🎁</span>
              )}
              {book.status === 'available' ? (
                <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs font-semibold font-[Inter] rounded-full border border-green-600/30">
                  Available
                </span>
              ) : book.status === 'off_shelf' ? (
                <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs font-semibold font-[Inter] rounded-full border border-gray-600/30">
                  Off Shelf
                </span>
              ) : book.status === 'in_transit' ? (
                <span className="px-2 py-1 bg-[#55B2DE]/20 text-[#55B2DE] text-xs font-semibold font-[Inter] rounded-full border border-[#55B2DE]/30">
                  Passing
                </span>
              ) : book.owner_id === userId && book.current_borrower ? (
                <span className="px-2 py-1 bg-amber-600/20 text-amber-400 text-xs font-semibold font-[Inter] rounded-full border border-amber-600/30 truncate max-w-[120px]">
                  Lent to {book.current_borrower.full_name.split(' ')[0]}
                </span>
              ) : book.current_borrower_id === userId ? (
                <span className="px-2 py-1 bg-amber-600/20 text-amber-400 text-xs font-semibold font-[Inter] rounded-full border border-amber-600/30">
                  You're borrowing
                </span>
              ) : book.current_borrower ? (
                <span className="px-2 py-1 bg-amber-600/20 text-amber-400 text-xs font-semibold font-[Inter] rounded-full border border-amber-600/30 truncate max-w-[120px]">
                  Borrowed by {book.current_borrower.full_name.split(' ')[0]}
                </span>
              ) : (
                <span className="px-2 py-1 bg-amber-600/20 text-amber-400 text-xs font-semibold font-[Inter] rounded-full border border-amber-600/30">
                  Borrowed
                </span>
              )}
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              {book.status === 'available' && book.owner_id !== userId && (
                <button
                  onClick={() => setRequestingBookId(book.id)}
                  className={`px-3 py-1.5 text-xs text-white rounded-lg font-medium active:scale-95 transition-all ${
                    book.gift_on_borrow 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600' 
                      : 'bg-[#55B2DE] hover:bg-[#4A9FCB]'
                  }`}
                >
                  {book.gift_on_borrow ? '🎁 Accept' : 'Borrow'}
                </button>
              )}
              {book.status === 'borrowed' && book.owner_id !== userId && book.current_borrower_id !== userId && (
                <>
                  {inQueue ? (
                    <button
                      onClick={() => handleLeaveQueue(book.id)}
                      disabled={loading === book.id}
                      className="px-3 py-1.5 text-xs bg-[#3F3F46] text-gray-300 rounded-lg font-medium hover:bg-[#52525B] disabled:opacity-50 active:scale-95 transition-all"
                    >
                      Leave Queue
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinQueue(book.id)}
                      disabled={loading === book.id}
                      className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 active:scale-95 transition-all"
                    >
                      Join Queue
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>

    {/* Request/Borrow Confirmation Dialog */}
    {requestingBookId && (
      <RequestConfirmationDialog
        bookId={requestingBookId}
        onClose={() => setRequestingBookId(null)}
        onSuccess={(result) => {
          setRequestingBookId(null)
          
          if (result.action === 'borrow') {
            // Update book status in place - borrowed books show as 'in_transit'
            if (onBookUpdate) {
              onBookUpdate(
                requestingBookId,
                {
                  status: 'in_transit',
                  current_borrower_id: userId,
                  current_borrower: { full_name: 'You' }
                },
                result.message
              )
            }
          } else {
            // Request action - book stays same status, just show toast
            if (onBookUpdate) {
              onBookUpdate(
                requestingBookId,
                {}, // No status change for joining queue
                result.message
              )
            }
          }
          
          // If no onBookUpdate callback, fall back to refresh
          if (!onBookUpdate) {
            router.refresh()
          }
        }}
      />
    )}
  </>
  )
}

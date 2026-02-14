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
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No books yet. Add your first book!</p>
      </div>
    )
  }

  return (
    <>
    <div className="border-t border-gray-200">
      {books.map((book) => {
        const inQueue = book.book_queue?.some(q => q.user_id === userId)
        
        return (
          <div 
            key={book.id} 
            className="flex items-center gap-3 px-2 py-2 border-b border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {/* Compact Cover */}
            <BookCover
              coverUrl={book.cover_url}
              title={book.title}
              author={book.author}
              isbn={book.isbn}
              status={book.status as any}
              className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0 transition-opacity"
            />

            {/* Book Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{book.title}</h3>
              {book.author && (
                <p className="text-xs text-gray-600 truncate">{book.author}</p>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {book.gift_on_borrow && (
                <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded font-medium">
                  🎁
                </span>
              )}
              {book.status === 'available' ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  Available
                </span>
              ) : book.status === 'off_shelf' ? (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  Off Shelf
                </span>
              ) : book.status === 'in_transit' ? (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Passing
                </span>
              ) : (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                  With {book.current_borrower?.full_name || 'Someone'}
                </span>
              )}
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              {book.status === 'available' && book.owner_id !== userId && (
                <button
                  onClick={() => {
                    console.log('[BooksListView] Borrow button clicked for book:', book.id, book.title)
                    setRequestingBookId(book.id)
                  }}
                  className={`px-3 py-1 text-xs text-white rounded ${
                    book.gift_on_borrow 
                      ? 'bg-pink-600 hover:bg-pink-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
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
                      className="px-3 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                    >
                      Leave Queue
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinQueue(book.id)}
                      disabled={loading === book.id}
                      className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
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

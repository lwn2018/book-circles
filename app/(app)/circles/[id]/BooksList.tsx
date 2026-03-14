'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { joinQueue, leaveQueue } from '@/lib/queue-actions'
import { completeGiftTransfer } from '@/lib/gift-actions'
import BuyAmazonButton from '@/app/components/BuyAmazonButton'
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

export default function BooksList({ 
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

  const handleReturn = async (bookId: string) => {
    setLoading(bookId)

    // Check if owner wanted this off shelf after return
    const { data: book } = await supabase
      .from('books')
      .select('off_shelf_return_status')
      .eq('id', bookId)
      .single()

    const returnToStatus = book?.off_shelf_return_status === 'off_shelf' ? 'off_shelf' : 'available'

    // Update book status
    const { error } = await supabase
      .from('books')
      .update({
        status: returnToStatus,
        current_borrower_id: null,
        borrowed_at: null,
        due_date: null,
        off_shelf_return_status: null // Clear the flag
      })
      .eq('id', bookId)

    if (!error) {
      // Update borrow history
      await supabase
        .from('borrow_history')
        .update({ returned_at: new Date().toISOString() })
        .eq('book_id', bookId)
        .is('returned_at', null)
      
      // Remove user from queue if they're in it (shouldn't be, but cleanup just in case)
      await supabase
        .from('book_queue')
        .delete()
        .eq('book_id', bookId)
        .eq('user_id', userId)

      // If returning to off_shelf, don't notify queue
      // If returning to available, existing flow handles queue notifications
    }

    setLoading(null)
    router.refresh()
  }

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
    {/* Grid layout for book cards */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {books.map((book) => {
        const inQueue = book.book_queue?.some(q => q.user_id === userId)
        const isOwner = book.owner_id === userId
        const isBorrower = book.current_borrower_id === userId
        
        return (
          <div 
            key={book.id} 
            className="bg-[#27272A] rounded-xl p-3 flex flex-col"
          >
            {/* Book Cover */}
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#3F3F46] mb-3">
              {book.cover_url ? (
                <img 
                  src={book.cover_url} 
                  alt={book.title}
                  className={`w-full h-full object-cover transition-opacity ${
                    book.status === 'available' ? 'opacity-100' : 
                    book.status === 'off_shelf' ? 'opacity-50' : 
                    'opacity-70'
                  }`}
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center transition-opacity ${
                  book.status === 'available' ? 'opacity-100' : 
                  book.status === 'off_shelf' ? 'opacity-50' : 
                  'opacity-70'
                }`}>
                  <span className="text-4xl">📚</span>
                </div>
              )}
              
              {/* Gift badge */}
              {book.gift_on_borrow && (
                <div className="absolute top-2 right-2">
                  <span className="text-lg">🎁</span>
                </div>
              )}
              
              {/* Status badge overlay */}
              <div className="absolute bottom-2 left-2 right-2">
                {book.status === 'off_shelf' ? (
                  <span className="text-xs font-semibold font-[Inter] bg-gray-600/20 text-gray-400 px-2 py-1 rounded-full inline-block backdrop-blur-sm border border-gray-600/30">
                    Off Shelf
                  </span>
                ) : book.status === 'available' ? (
                  <span className="text-xs font-semibold font-[Inter] bg-green-600/20 text-green-400 px-2 py-1 rounded-full inline-block backdrop-blur-sm border border-green-600/30">
                    Available
                  </span>
                ) : book.status === 'in_transit' ? (
                  <span className="text-xs font-semibold font-[Inter] bg-[#55B2DE]/20 text-[#55B2DE] px-2 py-1 rounded-full inline-block backdrop-blur-sm border border-[#55B2DE]/30">
                    Passing
                  </span>
                ) : isOwner && book.current_borrower ? (
                  <span className="text-xs font-semibold font-[Inter] bg-amber-600/20 text-amber-400 px-2 py-1 rounded-full inline-block backdrop-blur-sm border border-amber-600/30 truncate max-w-full">
                    Lent to {book.current_borrower.full_name.split(' ')[0]}
                  </span>
                ) : isBorrower ? (
                  <span className="text-xs font-semibold font-[Inter] bg-amber-600/20 text-amber-400 px-2 py-1 rounded-full inline-block backdrop-blur-sm border border-amber-600/30">
                    You're borrowing
                  </span>
                ) : book.current_borrower ? (
                  <span className="text-xs font-semibold font-[Inter] bg-amber-600/20 text-amber-400 px-2 py-1 rounded-full inline-block backdrop-blur-sm border border-amber-600/30 truncate max-w-full">
                    Borrowed by {book.current_borrower.full_name.split(' ')[0]}
                  </span>
                ) : (
                  <span className="text-xs font-semibold font-[Inter] bg-amber-600/20 text-amber-400 px-2 py-1 rounded-full inline-block backdrop-blur-sm border border-amber-600/30">
                    Borrowed
                  </span>
                )}
              </div>
            </div>

            {/* Book Info */}
            <div className="flex-1 flex flex-col">
              <h3 className="font-semibold font-[Inter] text-white text-sm line-clamp-2 mb-1">{book.title}</h3>
              {book.author && (
                <p className="text-xs text-gray-400 truncate mb-2">{book.author}</p>
              )}
              
              <p className="text-xs text-gray-500 mb-2">
                {isOwner ? 'Your book' : book.owner?.full_name}
              </p>

              {/* Queue indicator */}
              {book.book_queue && book.book_queue.length > 0 && (
                <div className="text-xs text-purple-400 mb-2">
                  {book.book_queue.length} in queue
                </div>
              )}

              {/* User queue status */}
              {inQueue && (
                <div className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded mb-2 text-center border border-purple-500/30">
                  You're #{book.book_queue?.find(q => q.user_id === userId)?.position}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-auto space-y-2">
                {book.status === 'available' && !isOwner && (
                  <button
                    onClick={() => setRequestingBookId(book.id)}
                    className={`w-full text-xs px-3 py-2 text-white rounded-lg font-medium active:scale-95 transition-all ${
                      book.gift_on_borrow 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600' 
                        : 'bg-[#55B2DE] hover:bg-[#4A9FCB]'
                    }`}
                  >
                    {book.gift_on_borrow ? '🎁 Accept Gift' : 'Borrow'}
                  </button>
                )}
                
                {isBorrower && (
                  <button
                    onClick={() => handleReturn(book.id)}
                    disabled={loading === book.id}
                    className="w-full text-xs px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {loading === book.id ? 'Returning...' : 'Return'}
                  </button>
                )}

                {/* Queue Actions */}
                {book.status === 'borrowed' && 
                 !isOwner && 
                 !isBorrower && (
                  <>
                    {inQueue ? (
                      <button
                        onClick={() => handleLeaveQueue(book.id)}
                        disabled={loading === book.id}
                        className="w-full text-xs px-3 py-2 bg-[#3F3F46] text-gray-300 rounded-lg font-medium hover:bg-[#52525B] disabled:opacity-50 active:scale-95 transition-all"
                      >
                        {loading === book.id ? 'Leaving...' : 'Leave Queue'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinQueue(book.id)}
                        disabled={loading === book.id}
                        className="w-full text-xs px-3 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 active:scale-95 transition-all"
                      >
                        {loading === book.id ? 'Joining...' : 'Join Queue'}
                      </button>
                    )}
                  </>
                )}

                {/* Buy on Amazon - subtle link */}
                {!isOwner && (
                  <div className="pt-1">
                    <BuyAmazonButton
                      book={{
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        isbn: book.isbn
                      }}
                      context="browsing_recommendation"
                      circleId={circleId}
                      variant="link"
                    >
                      Buy on Amazon
                    </BuyAmazonButton>
                  </div>
                )}
              </div>
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

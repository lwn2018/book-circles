'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { joinQueue, leaveQueue } from '@/lib/queue-actions'
import { completeGiftTransfer } from '@/lib/gift-actions'
import BuyAmazonButton from '@/app/components/BuyAmazonButton'

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
  circleMemberIds 
}: { 
  books: Book[]
  userId: string
  circleId: string
  circleMemberIds: string[]
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleBorrow = async (bookId: string) => {
    setLoading(bookId)
    
    // Check if this is a gift
    const book = books.find(b => b.id === bookId)
    
    if (book?.gift_on_borrow) {
      // Handle as gift transfer (immediate for MVP - in production would need handoff confirmation)
      const result = await completeGiftTransfer(bookId, userId, circleId)
      
      if (result.error) {
        console.error('Gift transfer error:', result.error)
        alert(`Failed to accept gift: ${result.error}`)
        setLoading(null)
        return
      }
      
      alert(`You've received "${book.title}" as a gift! It's now in your library.`)
      setLoading(null)
      router.refresh()
      return
    }
    
    // Normal borrow flow
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14) // 2 weeks from now

    const { error } = await supabase
      .from('books')
      .update({
        status: 'borrowed',
        current_borrower_id: userId,
        borrowed_at: new Date().toISOString(),
        due_date: dueDate.toISOString(),
        borrowed_in_circle_id: circleId
      })
      .eq('id', bookId)

    if (error) {
      console.error('Borrow error:', error)
      alert(`Failed to borrow: ${error.message}`)
      setLoading(null)
      return
    }

    // Create borrow history entry
    await supabase
      .from('borrow_history')
      .insert({
        book_id: bookId,
        borrower_id: userId,
        due_date: dueDate.toISOString()
      })

    setLoading(null)
    router.refresh()
  }

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
    const result = await joinQueue(bookId, userId)
    setLoading(null)
    
    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
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
    <div className="space-y-4">
      {books.map((book) => (
        <div key={book.id} className="p-4 border rounded-lg flex gap-4">
          {/* Book Cover */}
          {book.cover_url ? (
            <img 
              src={book.cover_url} 
              alt={book.title}
              className={`w-20 h-28 object-cover rounded shadow-sm flex-shrink-0 transition-opacity ${
                book.status === 'available' ? 'opacity-100' : 
                book.status === 'off_shelf' ? 'opacity-50' : 
                'opacity-70'
              }`}
            />
          ) : (
            <div className={`w-20 h-28 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 transition-opacity ${
              book.status === 'available' ? 'opacity-100' : 
              book.status === 'off_shelf' ? 'opacity-50' : 
              'opacity-70'
            }`}>
              <span className="text-3xl">📚</span>
            </div>
          )}

          {/* Book Details */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">{book.title}</h3>
                {book.author && (
                  <p className="text-gray-600 text-sm">by {book.author}</p>
                )}
                {book.isbn && (
                  <p className="text-gray-500 text-xs mt-1">ISBN: {book.isbn}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {book.status === 'off_shelf' ? (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    Off Shelf
                  </span>
                ) : book.status === 'available' ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    Available
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                    Borrowed
                  </span>
                )}
                
                {/* Gift Badge */}
                {book.gift_on_borrow && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded font-medium">
                    🎁 Gift
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              Owner: {book.owner?.full_name || 'Unknown'}
              {book.current_borrower && (
                <> • Currently with: {book.current_borrower.full_name}</>
              )}
              {book.due_date && (
                <> • Due: {new Date(book.due_date).toLocaleDateString()}</>
              )}
            </p>

            {/* Queue Details */}
            {book.book_queue && book.book_queue.length > 0 && (
              <div className="mb-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <p className="font-semibold mb-1">
                  Queue ({book.book_queue.length} {book.book_queue.length === 1 ? 'person' : 'people'}):
                </p>
                <ol className="space-y-1 list-decimal list-inside">
                  {book.book_queue.slice(0, 3).map((q) => {
                    // Check if queued person is in this circle
                    const isInCircle = circleMemberIds.includes(q.user_id)
                    const displayName = isInCircle 
                      ? (q.profiles?.full_name || 'Someone')
                      : 'Someone from another circle'
                    
                    return (
                      <li key={q.id} className="pl-2">
                        {displayName}
                        {isInCircle && q.pass_count && q.pass_count > 0 && (
                          <span className="ml-2 text-orange-600">
                            (passed {q.pass_count}×{q.last_pass_reason ? `: ${q.last_pass_reason}` : ''})
                          </span>
                        )}
                      </li>
                    )
                  })}
                  {book.book_queue.length > 3 && (
                    <li className="pl-2 text-gray-500">
                      + {book.book_queue.length - 3} more
                    </li>
                  )}
                </ol>
              </div>
            )}

            {/* Queue Status */}
            {book.book_queue && book.book_queue.some(q => q.user_id === userId) && (
              <div className="mb-2 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                You're #{book.book_queue.find(q => q.user_id === userId)?.position} in the queue
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {book.status === 'available' && book.owner_id !== userId && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      if (book.gift_on_borrow) {
                        if (!confirm(`${book.owner?.full_name} is gifting you "${book.title}". This book will become yours permanently. Accept this gift?`)) {
                          return
                        }
                      }
                      handleBorrow(book.id)
                    }}
                    disabled={loading === book.id}
                    className={`px-3 py-1 text-white text-sm rounded disabled:opacity-50 ${
                      book.gift_on_borrow 
                        ? 'bg-pink-600 hover:bg-pink-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {loading === book.id ? 
                      (book.gift_on_borrow ? 'Accepting...' : 'Borrowing...') : 
                      (book.gift_on_borrow ? '🎁 Accept Gift' : 'Borrow')
                    }
                  </button>
                  {book.gift_on_borrow && (
                    <p className="text-xs text-pink-600">
                      You'll own this permanently
                    </p>
                  )}
                </div>
              )}
              {book.status === 'off_shelf' && book.owner_id !== userId && (
                <div className="text-sm text-gray-500 italic">
                  Temporarily unavailable
                  {book.book_queue && book.book_queue.some(q => q.user_id === userId) && (
                    <span className="ml-2">(You're in the queue)</span>
                  )}
                </div>
              )}
              {book.current_borrower_id === userId && (
                <button
                  onClick={() => handleReturn(book.id)}
                  disabled={loading === book.id}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading === book.id ? 'Returning...' : 'Return'}
                </button>
              )}

              {/* Queue Actions */}
              {book.status === 'borrowed' && 
               book.owner_id !== userId && 
               book.current_borrower_id !== userId && (
                <>
                  {book.book_queue && book.book_queue.some(q => q.user_id === userId) ? (
                    <button
                      onClick={() => handleLeaveQueue(book.id)}
                      disabled={loading === book.id}
                      className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500 disabled:opacity-50"
                    >
                      {loading === book.id ? 'Leaving...' : 'Leave Queue'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinQueue(book.id)}
                      disabled={loading === book.id}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {loading === book.id ? 'Joining...' : 'Join Queue'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Buy Option for All Books (except your own) */}
            {book.owner_id !== userId && (
              <div className="mt-3 pt-3 border-t">
                {/* Show queue info if book is borrowed */}
                {book.status === 'borrowed' && book.book_queue && book.book_queue.length > 0 && (
                  <>
                    {/* Show estimated wait for current queue position */}
                    {book.book_queue.some(q => q.user_id === userId) ? (
                      <p className="text-sm text-gray-600 mb-2">
                        You'd be #{book.book_queue.find(q => q.user_id === userId)?.position} — 
                        estimated wait: {Math.ceil((book.book_queue.find(q => q.user_id === userId)?.position || 1) * 3)}-
                        {Math.ceil((book.book_queue.find(q => q.user_id === userId)?.position || 1) * 4)} weeks
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mb-2">
                        You'd be #{book.book_queue.length + 1} — 
                        estimated wait: {Math.ceil((book.book_queue.length + 1) * 3)}-
                        {Math.ceil((book.book_queue.length + 1) * 4)} weeks
                      </p>
                    )}
                    
                    {/* More prominent buy link if queue is long */}
                    {(book.book_queue.length >= 3 || 
                      (book.book_queue.some(q => q.user_id === userId) && 
                       book.book_queue.find(q => q.user_id === userId)?.position! >= 3)) && (
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Want your own copy instead?
                      </p>
                    )}
                  </>
                )}
                
                <BuyAmazonButton
                  book={{
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    isbn: book.isbn
                  }}
                  context={
                    book.status === 'borrowed' && book.book_queue && book.book_queue.length > 0
                      ? 'unavailable_to_borrow'
                      : 'browsing_recommendation'
                  }
                  circleId={circleId}
                  variant={
                    book.status === 'borrowed' && book.book_queue && book.book_queue.length >= 3 
                      ? 'primary' 
                      : 'link'
                  }
                >
                  {book.status === 'borrowed' && book.book_queue && book.book_queue.length >= 3 
                    ? '🛒 Buy on Amazon' 
                    : 'Buy on Amazon'}
                </BuyAmazonButton>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { joinQueue, leaveQueue } from '@/lib/queue-actions'
import BuyBookButton from '@/app/components/BuyBookButton'

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
  owner: { full_name: string } | null
  current_borrower: { full_name: string } | null
  owner_id: string
  current_borrower_id: string | null
  due_date: string | null
  book_queue?: QueueEntry[]
}

export default function BooksList({ books, userId, circleId }: { books: Book[]; userId: string; circleId: string }) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleBorrow = async (bookId: string) => {
    setLoading(bookId)
    
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14) // 2 weeks from now

    const { error } = await supabase
      .from('books')
      .update({
        status: 'borrowed',
        current_borrower_id: userId,
        borrowed_at: new Date().toISOString(),
        due_date: dueDate.toISOString()
      })
      .eq('id', bookId)

    if (!error) {
      // Also create borrow history entry
      await supabase
        .from('borrow_history')
        .insert({
          book_id: bookId,
          borrower_id: userId,
          due_date: dueDate.toISOString()
        })
    }

    setLoading(null)
    router.refresh()
  }

  const handleReturn = async (bookId: string) => {
    setLoading(bookId)

    // Update book status
    const { error } = await supabase
      .from('books')
      .update({
        status: 'available',
        current_borrower_id: null,
        borrowed_at: null,
        due_date: null
      })
      .eq('id', bookId)

    if (!error) {
      // Update borrow history
      await supabase
        .from('borrow_history')
        .update({ returned_at: new Date().toISOString() })
        .eq('book_id', bookId)
        .is('returned_at', null)
    }

    setLoading(null)
    router.refresh()
  }

  const handleDelete = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return
    
    setLoading(bookId)
    await supabase
      .from('books')
      .delete()
      .eq('id', bookId)

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
              className="w-20 h-28 object-cover rounded shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-28 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
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
              <div className="flex items-center gap-2">
                {book.status === 'available' ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    Available
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                    Borrowed
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
                  {book.book_queue.slice(0, 3).map((q) => (
                    <li key={q.id} className="pl-2">
                      {q.profiles?.full_name || 'Someone'}
                      {q.pass_count && q.pass_count > 0 && (
                        <span className="ml-2 text-orange-600">
                          (passed {q.pass_count}×{q.last_pass_reason ? `: ${q.last_pass_reason}` : ''})
                        </span>
                      )}
                    </li>
                  ))}
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

            <div className="flex gap-2">
              {book.status === 'available' && book.owner_id !== userId && (
                <button
                  onClick={() => handleBorrow(book.id)}
                  disabled={loading === book.id}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading === book.id ? 'Borrowing...' : 'Borrow'}
                </button>
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
              {book.owner_id === userId && (
                <button
                  onClick={() => handleDelete(book.id)}
                  disabled={loading === book.id}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Delete
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

            {/* Buy This Book Button */}
            <BuyBookButton 
              bookId={book.id}
              isbn={book.isbn}
              title={book.title}
              author={book.author}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

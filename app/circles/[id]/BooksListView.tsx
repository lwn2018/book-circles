'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinQueue, leaveQueue } from '@/lib/queue-actions'
import { completeGiftTransfer } from '@/lib/gift-actions'
import BuyAmazonButton from '@/app/components/BuyAmazonButton'
import { createClient } from '@/lib/supabase'

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
  book_queue?: any[]
}

export default function BooksListView({
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
    const book = books.find(b => b.id === bookId)
    
    if (book?.gift_on_borrow) {
      if (!confirm(`${book.owner?.full_name} is gifting you "${book.title}". Accept this gift?`)) {
        return
      }
      const result = await completeGiftTransfer(bookId, userId, circleId)
      if (result.error) {
        alert(`Failed: ${result.error}`)
        return
      }
      alert(`You've received "${book.title}" as a gift!`)
      router.refresh()
      return
    }

    // Normal borrow
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)

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

    if (!error) {
      await supabase.from('borrow_history').insert({
        book_id: bookId,
        borrower_id: userId,
        due_date: dueDate.toISOString()
      })
    }

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
    <div className="space-y-2">
      {books.map((book) => {
        const inQueue = book.book_queue?.some(q => q.user_id === userId)
        
        return (
          <div 
            key={book.id} 
            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Compact Cover */}
            {book.cover_url ? (
              <img 
                src={book.cover_url} 
                alt={book.title}
                className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-14 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📚</span>
              </div>
            )}

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
              ) : (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                  Borrowed
                </span>
              )}
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              {book.status === 'available' && book.owner_id !== userId && (
                <button
                  onClick={() => handleBorrow(book.id)}
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
  )
}

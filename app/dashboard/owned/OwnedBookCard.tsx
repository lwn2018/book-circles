'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recallBook, cancelRecall } from '@/lib/loan-actions'
import BookCover from '@/app/components/BookCover'

type Book = {
  id: string
  title: string
  author: string | null
  isbn: string | null
  cover_url: string | null
  status: string
  current_holder: { id: string; full_name: string }
  circle: { id: string; name: string }
  borrowed_at: string | null
  owner_recall_active: boolean
  queue: Array<{
    user_id: string
    position: number
    profiles: { id: string; full_name: string }
  }>
}

export default function OwnedBookCard({ book, userId }: { book: Book; userId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRecall = async () => {
    if (!confirm(`Request "${book.title}" back from ${book.current_holder.full_name}? They'll see a notification when they log in.`)) {
      return
    }

    setLoading(true)
    console.log('🔵 Recalling book:', { bookId: book.id, userId })
    
    const result = await recallBook(book.id, userId)
    console.log('🔵 Recall result:', result)
    
    if (result.error) {
      console.error('🔴 Error:', result.error)
      alert(`❌ Error: ${result.error}`)
      setLoading(false)
      return
    }

    console.log('✅ Book recall activated!')
    alert(`✅ Recall request sent to ${result.borrowerName}. They'll return it to you when they pass it on.`)
    setLoading(false)
    router.refresh()
  }

  const handleCancelRecall = async () => {
    if (!confirm('Cancel recall request?')) {
      return
    }

    setLoading(true)
    console.log('🔵 Canceling recall:', { bookId: book.id, userId })
    
    const result = await cancelRecall(book.id, userId)
    console.log('🔵 Cancel result:', result)
    
    if (result.error) {
      console.error('🔴 Error:', result.error)
      alert(`❌ Error: ${result.error}`)
      setLoading(false)
      return
    }

    console.log('✅ Recall cancelled!')
    alert('✅ Recall request cancelled.')
    setLoading(false)
    router.refresh()
  }

  const borrowedDays = book.borrowed_at 
    ? Math.floor((Date.now() - new Date(book.borrowed_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <div className="flex gap-4">
        {/* Book Cover */}
        <BookCover
          coverUrl={book.cover_url}
          title={book.title}
          author={book.author}
          isbn={book.isbn}
          className="w-24 h-32 object-cover rounded shadow-sm flex-shrink-0"
        />

        {/* Book Info */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-1">{book.title}</h2>
          {book.author && (
            <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
          )}

          <div className="space-y-1 text-sm text-gray-700 mb-4">
            <p>Currently with: <span className="font-medium">{book.current_holder.full_name}</span></p>
            <p>Circle: <span className="font-medium">{book.circle.name}</span></p>
            <p>Borrowed: <span className="text-gray-600">{borrowedDays} days ago</span></p>
          </div>

          {/* Owner Recall Status */}
          {book.owner_recall_active ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                ⚠️ <strong>Recall active:</strong> {book.current_holder.full_name} knows you need this book back. It will return to you when they pass it on.
              </p>
              <button
                onClick={handleCancelRecall}
                disabled={loading}
                className="text-sm text-yellow-800 underline hover:no-underline"
              >
                Cancel recall
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 p-3 rounded mb-4">
              <p className="text-sm text-gray-700">
                Need this book back? You can request it to be returned to you when the current borrower passes it on.
              </p>
            </div>
          )}

          {/* Queue Info */}
          {book.queue.length > 0 && (
            <div className="bg-gray-50 p-3 rounded mb-4">
              <p className="text-sm text-gray-700 mb-1"><strong>People waiting:</strong></p>
              <p className="text-sm text-gray-700">
                → {book.queue[0].profiles.full_name}
              </p>
              {book.queue.length > 1 && (
                <p className="text-sm text-gray-600 ml-4">
                  Then: {book.queue.slice(1).map(q => q.profiles.full_name).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {!book.owner_recall_active && (
            <button
              onClick={handleRecall}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Processing...' : '📣 Request Book Back'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { handleAcceptResponse, handlePassResponse, leaveQueue } from '@/lib/queue-actions'
import PassReasonModal from './PassReasonModal'

type BookOffer = {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  current_holder: { id: string; full_name: string }
  circle: { id: string; name: string }
  queue_position?: number
  pass_count?: number
}

export default function BookOfferCard({ book, userId, queueEntryId }: { 
  book: BookOffer
  userId: string 
  queueEntryId?: string
}) {
  const [loading, setLoading] = useState(false)
  const [showPassModal, setShowPassModal] = useState(false)
  const router = useRouter()

  const handleAccept = async () => {
    setLoading(true)
    const result = await handleAcceptResponse(book.id, userId)
    
    if (result.error) {
      alert(result.error)
      setLoading(false)
      return
    }

    alert('Great! The current holder has been notified. Coordinate pickup with them.')
    router.refresh()
  }

  const handlePass = async (reason: string, shouldRemove: boolean) => {
    setLoading(true)
    
    if (shouldRemove) {
      const result = await leaveQueue(book.id, userId)
      
      if (result.error) {
        alert(result.error)
        setLoading(false)
        return
      }
      
      alert('Removed from queue')
    } else {
      const result = await handlePassResponse(book.id, userId, reason)
      
      if (result.error) {
        alert(result.error)
        setLoading(false)
        return
      }

      if (result.movedToPosition2) {
        alert('You\'ve passed 3 times and moved to position 2 in the queue')
      }
    }

    setShowPassModal(false)
    router.refresh()
  }

  return (
    <>
      <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50 shadow-sm">
        <div className="flex gap-4">
          {/* Book Cover */}
          {book.cover_url ? (
            <img 
              src={book.cover_url} 
              alt={book.title}
              className="w-24 h-32 object-cover rounded shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-32 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">📚</span>
            </div>
          )}

          {/* Book Info */}
          <div className="flex-1">
            <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded inline-block mb-2">
              YOUR TURN!
            </div>
            
            <h2 className="text-xl font-semibold mb-1">{book.title}</h2>
            {book.author && (
              <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
            )}

            <div className="space-y-1 text-sm text-gray-700 mb-4">
              <p>Available from: <span className="font-medium">{book.current_holder.full_name}</span></p>
              <p>Circle: <span className="font-medium">{book.circle.name}</span></p>
              {book.pass_count !== undefined && book.pass_count > 0 && (
                <p className="text-orange-600">
                  You've passed {book.pass_count} time{book.pass_count > 1 ? 's' : ''}
                  {book.pass_count >= 2 && ' (One more and you move to position 2)'}
                </p>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-4">
              This book is ready for you! Would you like to get it?
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Processing...' : 'Yes, I\'ll Get It'}
              </button>
              <button
                onClick={() => setShowPassModal(true)}
                disabled={loading}
                className="px-6 py-2 border-2 border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 font-medium"
              >
                Pass For Now
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              💡 You have 48 hours to respond. No response = automatic pass.
            </p>
          </div>
        </div>
      </div>

      {/* Pass Reason Modal */}
      {showPassModal && (
        <PassReasonModal
          bookTitle={book.title}
          passCount={book.pass_count || 0}
          onPass={handlePass}
          onCancel={() => setShowPassModal(false)}
        />
      )}
    </>
  )
}

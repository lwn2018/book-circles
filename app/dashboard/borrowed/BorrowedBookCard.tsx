'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { markReadyToPassOn, handleAcceptResponse, confirmHandoff } from '@/lib/queue-actions'

type Book = {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  status: string
  owner: { id: string; full_name: string }
  circle: { id: string; name: string }
  due_date: string | null
  owner_recall_active: boolean
  next_recipient: string | null
  queue: Array<{
    user_id: string
    position: number
    profiles: { id: string; full_name: string }
  }>
}

export default function BorrowedBookCard({ book, userId }: { book: Book; userId: string }) {
  const [loading, setLoading] = useState(false)
  const [showPassOnModal, setShowPassOnModal] = useState(false)
  const [passOnData, setPassOnData] = useState<any>(null)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const router = useRouter()

  // Calculate days remaining on client side only to avoid hydration mismatch
  useEffect(() => {
    if (book.due_date) {
      const days = Math.ceil((new Date(book.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      setDaysRemaining(days)
    }
  }, [book.due_date])

  const handleReadyToPassOn = async () => {
    setLoading(true)
    console.log('Calling markReadyToPassOn with:', { bookId: book.id, userId })
    const result = await markReadyToPassOn(book.id, userId)
    console.log('markReadyToPassOn result:', result)
    
    if (result.error) {
      alert(`Error: ${result.error}`)
      setLoading(false)
      return
    }

    if (result.success) {
      alert(`Success! Offering to ${result.nextRecipientName}. Check if status updates...`)
      setPassOnData(result)
      setShowPassOnModal(true)
      setLoading(false)
      router.refresh()
    } else {
      alert('Unexpected response: ' + JSON.stringify(result))
      setLoading(false)
    }
  }

  const handleConfirmHandoff = async () => {
    if (!passOnData?.nextRecipient) return

    setLoading(true)
    const result = await confirmHandoff(book.id, userId, passOnData.nextRecipient)
    
    if (result.error) {
      alert(result.error)
      setLoading(false)
      return
    }

    setShowPassOnModal(false)
    router.refresh()
  }

  return (
    <>
      <div className="border rounded-lg p-6 bg-white shadow-sm">
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
            <h2 className="text-xl font-semibold mb-1">{book.title}</h2>
            {book.author && (
              <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
            )}

            <div className="space-y-1 text-sm text-gray-700 mb-4">
              <p>Borrowed from: <span className="font-medium">{book.owner.full_name}</span></p>
              <p>Circle: <span className="font-medium">{book.circle.name}</span></p>
              {book.due_date && (
                <p>
                  Due: {new Date(book.due_date).toLocaleDateString()}
                  {daysRemaining !== null && (
                    <span className={daysRemaining < 0 ? 'text-red-600 ml-2' : daysRemaining <= 3 ? 'text-orange-600 ml-2' : 'text-gray-600 ml-2'}>
                      ({daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`})
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Owner Recall Warning */}
            {book.owner_recall_active && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>{book.owner.full_name}</strong> needs this book back. Please return when finished.
                </p>
              </div>
            )}

            {/* Queue Info */}
            {book.queue.length > 0 && (
              <div className="bg-blue-50 p-3 rounded mb-4">
                <p className="text-sm text-gray-700 mb-1"><strong>Queue behind you:</strong></p>
                <p className="text-sm text-gray-700">
                  → Next: <span className="font-medium">{book.queue[0]?.profiles.full_name}</span>
                </p>
                {book.queue.length > 1 && (
                  <p className="text-sm text-gray-600 ml-4">
                    Then: {book.queue.slice(1).map(q => q.profiles.full_name).join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            {book.status === 'borrowed' && (
              <div className="flex gap-3">
                <button
                  onClick={handleReadyToPassOn}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  {loading ? 'Processing...' : 'Ready to Pass On'}
                </button>
                <button
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Extend Loan
                </button>
              </div>
            )}

            {book.status === 'ready_for_next' && (
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-700">
                  ✓ Marked as ready. Waiting for {passOnData?.nextRecipientName || 'next person'} to confirm...
                </p>
              </div>
            )}

            {book.status === 'awaiting_handoff' && (
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-700 mb-3">
                  ✓ {passOnData?.nextRecipientName || 'Next person'} confirmed! Coordinate handoff with them.
                </p>
                <button
                  onClick={handleConfirmHandoff}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {loading ? 'Processing...' : 'I Gave It To Them'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pass On Modal */}
      {showPassOnModal && passOnData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {passOnData.isOwnerRecall ? 'Return to Owner' : 'Pass to Next Person'}
            </h3>
            
            {passOnData.isOwnerRecall ? (
              <div>
                <p className="mb-4">Return this book to:</p>
                <p className="text-lg font-medium mb-2">{book.owner.full_name}</p>
                <p className="text-sm text-gray-600 mb-4">(Owner needs it back)</p>
              </div>
            ) : passOnData.queueExists ? (
              <div>
                <p className="mb-4">Give "{book.title}" to:</p>
                <p className="text-lg font-medium mb-2">{passOnData.nextRecipientName}</p>
                <p className="text-sm text-gray-600 mb-4">from {book.circle.name} circle</p>
                <p className="text-sm text-gray-500">Waiting for them to confirm...</p>
              </div>
            ) : (
              <div>
                <p className="mb-4">Return "{book.title}" to:</p>
                <p className="text-lg font-medium mb-2">{book.owner.full_name}</p>
                <p className="text-sm text-gray-600">No one else is waiting for this book</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPassOnModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

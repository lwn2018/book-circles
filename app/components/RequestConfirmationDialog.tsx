'use client'

import { useState, useEffect } from 'react'

type RequestInfo = {
  book: {
    id: string
    title: string
    author: string | null
    status: string
    ownerName: string
    ownerId: string
  }
  queue: {
    length: number
    yourPosition: number
    currentHolder: string | null
    isAvailable: boolean
  }
  alreadyInQueue: boolean
}

type Props = {
  bookId: string
  onClose: () => void
  onSuccess: (result: { 
    action: 'borrow' | 'request', 
    message: string,
    bookTitle: string,
    ownerName: string,
    queuePosition?: number
  }) => void
}

export default function RequestConfirmationDialog({ bookId, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState<RequestInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch book + queue info
  useEffect(() => {
    console.log('[RequestDialog] Mounting for bookId:', bookId)
    async function fetchInfo() {
      console.log('[RequestDialog] Fetching book info...')
      try {
        const response = await fetch(`/api/books/${bookId}/request`)
        const data = await response.json()
        console.log('[RequestDialog] API response:', response.status, data)

        if (!response.ok) {
          setError(data.error || 'Failed to load book info')
          return
        }

        if (data.alreadyInQueue) {
          setError("You're already in the queue for this book")
          return
        }

        setInfo(data)
      } catch (err: any) {
        console.error('[RequestDialog] Fetch error:', err)
        setError(err.message || 'Failed to load book info')
      } finally {
        setLoading(false)
      }
    }

    fetchInfo()
  }, [bookId])

  const handleRequest = async () => {
    console.log('[RequestDialog] handleRequest called, info:', info)
    if (!info) return

    setSubmitting(true)
    setError(null)

    try {
      // If book is available, call borrow API (creates handoff)
      // Otherwise call request API (joins queue)
      const isBorrow = info.queue.isAvailable
      const endpoint = isBorrow 
        ? `/api/books/${bookId}/borrow`
        : `/api/books/${bookId}/request`
      
      console.log('[RequestDialog] Calling endpoint:', endpoint, 'isBorrow:', isBorrow)
      
      const response = await fetch(endpoint, {
        method: 'POST'
      })

      const data = await response.json()
      console.log('[RequestDialog] Response:', response.status, data)

      if (!response.ok) {
        setError(data.error || 'Failed to request book')
        return
      }

      // Success! Call onSuccess callback with result data
      console.log('[RequestDialog] Success, calling onSuccess')
      onSuccess({
        action: isBorrow ? 'borrow' : 'request',
        message: data.message,
        bookTitle: info.book.title,
        ownerName: info.book.ownerName,
        queuePosition: data.position
      })
    } catch (err: any) {
      console.error('[RequestDialog] Error:', err)
      setError(err.message || 'Failed to request book')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
            <div className="text-center py-8">
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!info) return null

  const { book, queue } = info

  // Generate context message
  let contextMessage = ''
  if (queue.isAvailable) {
    contextMessage = `This book is available — ${book.ownerName} will be notified.`
  } else if (queue.length === 0) {
    contextMessage = `Currently with ${queue.currentHolder || book.ownerName} — you'll be first in the queue.`
  } else if (queue.length === 1) {
    contextMessage = `You'll be #${queue.yourPosition} — currently with ${queue.currentHolder || book.ownerName}`
  } else {
    contextMessage = `You'll be #${queue.yourPosition} in the queue — currently with ${queue.currentHolder || book.ownerName}`
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50" 
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
          {/* Title */}
          <h2 className="text-xl font-bold mb-2">Request {book.title}?</h2>
          
          {/* Author */}
          {book.author && (
            <p className="text-sm text-gray-600 mb-4">by {book.author}</p>
          )}

          {/* Queue Context */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">{contextMessage}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleRequest}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {submitting ? 'Requesting...' : 'Request'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

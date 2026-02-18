'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initiateDoneReading } from '@/lib/done-reading-action'

interface DoneReadingButtonProps {
  bookId: string
  bookTitle: string
  status: string
  ownerName?: string
  isOwner?: boolean  // true if user owns this book (gift that transferred)
}

export default function DoneReadingButton({ 
  bookId, 
  bookTitle, 
  status, 
  ownerName,
  isOwner = false
}: DoneReadingButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ receiverName?: string, isOwnBook?: boolean } | null>(null)
  const router = useRouter()

  // Don't show button if handoff already in progress
  if (status === 'in_transit' || status === 'passing') {
    return null
  }

  const handleDoneReading = async () => {
    if (loading) return

    // Different confirmation message if user owns the book
    const confirmMessage = isOwner
      ? `Finished with "${bookTitle}"?\n\nThis will mark it as available on your shelf.`
      : `Ready to return "${bookTitle}"?\n\nWe'll notify ${ownerName || 'the owner'} to arrange the handoff.`

    const confirmed = confirm(confirmMessage)

    if (!confirmed) return

    setLoading(true)

    try {
      const result = await initiateDoneReading(bookId)

      if (result.error) {
        alert(result.error)
        setLoading(false)
        return
      }

      if (result.success) {
        // Check if this was the user's own book (gift)
        if (result.isOwnBook) {
          setSuccess({ isOwnBook: true })
        } else {
          setSuccess({ receiverName: result.receiverName || ownerName || 'the owner' })
        }
        setLoading(false)
        
        // Refresh to show updated state
        router.refresh()
      }
    } catch (error: any) {
      console.error('Done reading error:', error)
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // Show success state instead of button
  if (success) {
    if (success.isOwnBook) {
      return (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          ✓ Marked as available on your shelf!
        </div>
      )
    }
    return (
      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
        ✓ {success.receiverName} notified! Check Pending Handoffs above when ready.
      </div>
    )
  }

  return (
    <button
      onClick={handleDoneReading}
      disabled={loading}
      className="mt-3 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Processing...' : 'Done reading'}
    </button>
  )
}

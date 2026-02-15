'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initiateDoneReading } from '@/lib/done-reading-action'

interface DoneReadingButtonProps {
  bookId: string
  bookTitle: string
  status: string
  ownerName?: string
}

export default function DoneReadingButton({ bookId, bookTitle, status, ownerName }: DoneReadingButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ receiverName: string } | null>(null)
  const router = useRouter()

  // Don't show button if handoff already in progress
  if (status === 'in_transit' || status === 'passing') {
    return null
  }

  const handleDoneReading = async () => {
    if (loading) return

    // Single confirmation
    const confirmed = confirm(
      `Ready to return "${bookTitle}"?\n\nWe'll notify ${ownerName || 'the owner'} to arrange the handoff.`
    )

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
        // Show inline success - no popup, no navigation
        setSuccess({ receiverName: result.receiverName || ownerName || 'the owner' })
        setLoading(false)
        
        // Refresh to show pending handoff section
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

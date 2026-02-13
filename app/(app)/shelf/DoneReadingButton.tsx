'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initiateDoneReading } from '@/lib/done-reading-action'

interface DoneReadingButtonProps {
  bookId: string
  bookTitle: string
  status: string
}

export default function DoneReadingButton({ bookId, bookTitle, status }: DoneReadingButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Don't show button if handoff already in progress
  if (status === 'passing') {
    return null
  }

  const handleDoneReading = async () => {
    if (loading) return

    const confirmed = confirm(
      `Ready to pass on "${bookTitle}"?\n\nWe'll notify the next person or owner to arrange the handoff.`
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

      if (result.success && result.handoffId) {
        // Show success message
        const message = result.isPagepass
          ? `Nice! ${result.receiverName} is next — we'll notify you both to arrange the handoff.`
          : `We'll let ${result.receiverName} know you're ready to return "${bookTitle}".`
        
        alert(message)
        
        // Navigate to handoff card
        router.push(`/handoff/${result.handoffId}`)
      }
    } catch (error: any) {
      console.error('Done reading error:', error)
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDoneReading}
      disabled={loading}
      className="mt-3 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
    >
      {loading ? 'Processing...' : 'Done reading'}
    </button>
  )
}

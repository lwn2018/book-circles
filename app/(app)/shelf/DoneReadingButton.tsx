'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initiateDoneReading } from '@/lib/done-reading-action'

interface DoneReadingButtonProps {
  bookId: string
  bookTitle: string
  status: string
  ownerName?: string
  isOwner?: boolean
  variant?: 'solid' | 'outline'
}

export default function DoneReadingButton({ 
  bookId, 
  bookTitle, 
  status, 
  ownerName,
  isOwner = false,
  variant = 'solid'
}: DoneReadingButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ receiverName?: string, isOwnBook?: boolean } | null>(null)
  const router = useRouter()

  if (status === 'in_transit' || status === 'passing') return null

  const handleDoneReading = async () => {
    if (loading) return

    const confirmMessage = isOwner
      ? `Finished with "${bookTitle}"?\n\nThis will mark it as available on your shelf.`
      : `Ready to return "${bookTitle}"?\n\nWe'll notify ${ownerName || 'the owner'} to arrange the handoff.`

    if (!confirm(confirmMessage)) return

    setLoading(true)

    try {
      const result = await initiateDoneReading(bookId)

      if (result.error) {
        alert(result.error)
        setLoading(false)
        return
      }

      if (result.success) {
        if (result.isOwnBook) {
          setSuccess({ isOwnBook: true })
        } else {
          setSuccess({ receiverName: result.receiverName || ownerName || 'the owner' })
        }
        setLoading(false)
        router.refresh()
      }
    } catch (error: any) {
      console.error('Done reading error:', error)
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    if (success.isOwnBook) {
      return (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400">
          ✓ Marked as available on your shelf!
        </div>
      )
    }
    return (
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400">
        ✓ {success.receiverName} notified! Check Pending Handoffs when ready.
      </div>
    )
  }

  const buttonStyles = variant === 'outline'
    ? 'w-full px-4 py-3 border-2 border-[#55B2DE] text-[#55B2DE] hover:bg-[#55B2DE]/10 rounded-xl text-sm font-medium transition-colors disabled:opacity-50'
    : 'w-full px-4 py-2.5 bg-[#27272A] hover:bg-[#3F3F46] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 border border-[#333]'

  return (
    <button onClick={handleDoneReading} disabled={loading} className={buttonStyles}>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Done Reading
        </span>
      )}
    </button>
  )
}

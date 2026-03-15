'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type GiftToggleProps = {
  bookId: string
  isGift: boolean
  bookTitle: string
}

export default function GiftToggle({ bookId, isGift, bookTitle }: GiftToggleProps) {
  const [loading, setLoading] = useState(false)
  const [giftStatus, setGiftStatus] = useState(isGift)
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/books/${bookId}/gift-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gift: !giftStatus })
      })

      if (response.ok) {
        setGiftStatus(!giftStatus)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to toggle gift status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleToggle()
      }}
      disabled={loading}
      className={`p-2 rounded-lg transition-colors ${
        giftStatus 
          ? 'bg-pink-500/30 hover:bg-pink-500/40' 
          : 'bg-white/5 hover:bg-white/10'
      }`}
      title={giftStatus ? 'This book is a gift - tap to undo' : 'Mark as gift - next borrower keeps it'}
    >
      <svg 
        className={`w-5 h-5 ${giftStatus ? 'text-pink-400' : 'text-white/40'}`} 
        fill={giftStatus ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    </button>
  )
}

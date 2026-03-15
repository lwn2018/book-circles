'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { completeGiftTransfer } from '@/lib/gift-actions'
import { buildAmazonUrl } from '@/app/components/BuyAmazonButton'

type BookActionsProps = {
  book: {
    id: string
    title: string
    author: string | null
    isbn: string | null
    status: string
    gift_on_borrow?: boolean
    owner_id: string
    owner?: { full_name: string } | null
  }
  userId: string
  circleId?: string
  isOwner: boolean
  isBorrower: boolean
  inQueue: boolean
}

export default function BookActions({ book, userId, circleId, isOwner, isBorrower, inQueue }: BookActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isAvailable = book.status === 'available'
  const isOffShelf = book.status === 'off_shelf'
  const canBorrow = !isOwner && isAvailable && !isOffShelf
  const canQueue = !isOwner && !isAvailable && !inQueue && !isBorrower && !isOffShelf

  const handleBorrow = async () => {
    if (loading) return
    setLoading(true)

    try {
      // Handle gift books
      if (book.gift_on_borrow) {
        if (!confirm(`${book.owner?.full_name || 'The owner'} is gifting you "${book.title}". Accept this gift?`)) {
          setLoading(false)
          return
        }
        if (!circleId) throw new Error('Circle not found')
        const result = await completeGiftTransfer(book.id, userId, circleId)
        if (result.error) throw new Error(result.error)
        router.refresh()
        return
      }

      // Use the proper borrow API with handoff flow
      const response = await fetch(`/api/books/${book.id}/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circle_id: circleId })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to borrow')
      }

      // Navigate to shelf to see pending handoff
      router.push('/shelf')
      router.refresh()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinQueue = async () => {
    if (loading) return
    setLoading(true)

    try {
      const { data: queueData } = await supabase
        .from('book_queue')
        .select('position')
        .eq('book_id', book.id)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = (queueData?.[0]?.position || 0) + 1

      const { error } = await supabase.from('book_queue').insert({
        book_id: book.id,
        user_id: userId,
        position: nextPosition
      })

      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const logAmazonClick = () => {
    fetch('/api/events/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'amazon_link_clicked',
        metadata: { book_title: book.title, book_id: book.id }
      })
    }).catch(() => {})
  }

  const amazonUrl = buildAmazonUrl(book.isbn || `${book.title} ${book.author || ''}`)

  return (
    <div className="flex gap-3 mb-6">
      {/* Borrow / Accept Gift / Join Queue */}
      {canBorrow && (
        <button
          onClick={handleBorrow}
          disabled={loading}
          className={`flex-1 py-3 rounded-xl font-semibold text-base transition disabled:opacity-50 ${
            book.gift_on_borrow
              ? 'bg-[#EC4899] text-white hover:bg-[#DB2777]'
              : 'bg-[#4ADE80] text-[#1A1A1A] hover:bg-[#22C55E]'
          }`}
        >
          {loading ? '...' : book.gift_on_borrow ? '🎁 Accept Gift' : 'Borrow'}
        </button>
      )}

      {canQueue && (
        <button
          onClick={handleJoinQueue}
          disabled={loading}
          className="flex-1 py-3 bg-[#8B5CF6] text-white rounded-xl font-semibold text-base hover:bg-[#7C3AED] transition disabled:opacity-50"
        >
          {loading ? '...' : 'Join Queue'}
        </button>
      )}

      {inQueue && (
        <div className="flex-1 py-3 bg-[#1A2A3A] text-[#94A3B8] rounded-xl font-semibold text-base text-center">
          You're in the queue
        </div>
      )}

      {isBorrower && (
        <div className="flex-1 py-3 bg-[#2A2A1A] text-[#FACC15] rounded-xl font-semibold text-base text-center">
          You're reading this
        </div>
      )}

      {isOffShelf && !isOwner && (
        <div className="flex-1 py-3 bg-[#2A2A2A] text-[#6B7280] rounded-xl font-semibold text-base text-center">
          Temporarily unavailable
        </div>
      )}

      {/* Buy on Amazon - always visible */}
      <a
        href={amazonUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={logAmazonClick}
        className="flex-1 py-3 bg-[#FF9900] text-[#232F3E] rounded-xl font-semibold text-base text-center hover:bg-[#FFB84D] transition flex items-center justify-center gap-2"
      >
        <span>Buy</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}

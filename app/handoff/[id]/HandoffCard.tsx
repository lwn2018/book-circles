'use client'

import { useState, useEffect } from 'react'
import { confirmHandoff } from '@/lib/handoff-actions'
import { useRouter } from 'next/navigation'
import Avatar from '@/app/components/Avatar'
import BookCover from '@/app/components/BookCover'
import Link from 'next/link'

type Person = {
  id: string
  full_name: string
  avatar_type?: 'upload' | 'preset' | 'initials' | null
  avatar_id?: string | null
  avatar_url?: string | null
  contact_preference_type?: string | null
  contact_preference_value?: string | null
}

type RecentHandoff = {
  id: string
  both_confirmed_at: string
  book: { id: string; title: string; cover_url: string | null }
  giver: Person
  receiver: Person
}

type HandoffCardProps = {
  handoff: {
    id: string
    giver_confirmed_at: string | null
    receiver_confirmed_at: string | null
    both_confirmed_at: string | null
    book: {
      id: string
      title: string
      author?: string | null
      cover_url: string | null
    }
    giver: Person
    receiver: Person
  }
  role: 'giver' | 'receiver'
  userId: string
  recentHandoffs?: RecentHandoff[] | null
}

export default function HandoffCard({ handoff, role, userId, recentHandoffs }: HandoffCardProps) {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(
    role === 'giver' ? !!handoff.giver_confirmed_at : !!handoff.receiver_confirmed_at
  )
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()

  const [otherConfirmed, setOtherConfirmed] = useState(
    role === 'giver' ? !!handoff.receiver_confirmed_at : !!handoff.giver_confirmed_at
  )

  const currentHolder = handoff.giver
  const nextReader = handoff.receiver

  // Poll for updates when waiting for other person to confirm
  useEffect(() => {
    if (!confirmed || otherConfirmed || showSuccess) return

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/handoff/${handoff.id}/status`)
        if (response.ok) {
          const data = await response.json()
          if (data.bothConfirmed) {
            setOtherConfirmed(true)
            setShowSuccess(true)
          } else if (data.otherConfirmed) {
            setOtherConfirmed(true)
          }
        }
      } catch (e) {
        console.error('Failed to check handoff status:', e)
      }
    }

    const interval = setInterval(checkStatus, 5000)
    checkStatus()

    return () => clearInterval(interval)
  }, [confirmed, otherConfirmed, showSuccess, handoff.id])

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const result = await confirmHandoff(handoff.id, userId, role)
      
      if (result.error) {
        console.error('Confirmation error:', result.error)
        alert('Error: ' + result.error)
        setLoading(false)
        return
      }

      setConfirmed(true)
      setLoading(false)

      if (result.bothConfirmed) {
        setShowSuccess(true)
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error('Unexpected error during confirmation:', error)
      alert('Unexpected error: ' + (error.message || 'Unknown error'))
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Success screen
  if (showSuccess || handoff.both_confirmed_at) {
    return (
      <div className="flex flex-col items-center">
        {/* Success checkmark */}
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Handoff Complete!</h2>
        <p className="text-white/60 text-center mb-8">
          {role === 'receiver' 
            ? `Enjoy "${handoff.book.title}"!`
            : `"${handoff.book.title}" is now with ${nextReader.full_name}!`
          }
        </p>

        {/* Book cover */}
        <div className="mb-8">
          <BookCover
            coverUrl={handoff.book.cover_url}
            title={handoff.book.title}
            author={handoff.book.author}
            className="w-32 h-48 object-cover rounded-lg shadow-xl"
          />
        </div>

        {/* Navigation buttons */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => router.push('/shelf')}
            className="w-full py-4 bg-[#55B2DE] text-white rounded-xl font-semibold hover:bg-[#4A9FCB] transition-colors"
          >
            Go to My Shelf
          </button>
          <button
            onClick={() => router.push('/circles')}
            className="w-full py-4 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
          >
            Browse Circles
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Book Display Section */}
      <div className="relative">
        {/* Pending badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
            Pending Handoff
          </span>
        </div>

        {/* Angled book cover */}
        <div className="flex justify-center py-8">
          <div className="transform rotate-[-3deg] shadow-2xl">
            <BookCover
              coverUrl={handoff.book.cover_url}
              title={handoff.book.title}
              author={handoff.book.author}
              className="w-40 h-60 object-cover rounded-lg"
            />
          </div>
        </div>

        {/* Book title and author */}
        <div className="text-center mt-4">
          <h2 className="text-xl font-bold text-white">{handoff.book.title}</h2>
          {handoff.book.author && (
            <p className="text-white/50 text-sm mt-1">{handoff.book.author}</p>
          )}
        </div>
      </div>

      {/* Two-Person Handoff Visual */}
      <div className="bg-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Current Holder */}
          <div className="flex flex-col items-center text-center">
            <div className="ring-2 ring-orange-500 ring-offset-2 ring-offset-[#121212] rounded-full">
              <Avatar
                avatarType={currentHolder.avatar_type}
                avatarId={currentHolder.avatar_id}
                avatarUrl={currentHolder.avatar_url}
                userName={currentHolder.full_name}
                userId={currentHolder.id}
                size="md"
              />
            </div>
            <p className="text-white text-sm font-medium mt-2 max-w-[80px] truncate">
              {currentHolder.full_name}
            </p>
            <p className="text-orange-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
              Current Holder
            </p>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 px-2">
            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>

          {/* Next Reader */}
          <div className="flex flex-col items-center text-center">
            <div className="ring-2 ring-orange-500 ring-offset-2 ring-offset-[#121212] rounded-full">
              <Avatar
                avatarType={nextReader.avatar_type}
                avatarId={nextReader.avatar_id}
                avatarUrl={nextReader.avatar_url}
                userName={nextReader.full_name}
                userId={nextReader.id}
                size="md"
              />
            </div>
            <p className="text-white text-sm font-medium mt-2 max-w-[80px] truncate">
              {nextReader.full_name}
            </p>
            <p className="text-orange-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
              Next Reader
            </p>
          </div>
        </div>

        <p className="text-white/60 text-sm text-center mt-4">
          Confirm that the book has been passed to the next reader.
        </p>

        {/* Status indicators */}
        {confirmed && !otherConfirmed && (
          <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-xl p-3 text-center">
            <p className="text-sm text-green-400">
              ✓ You confirmed! Waiting for {role === 'giver' ? nextReader.full_name : currentHolder.full_name}...
            </p>
          </div>
        )}

        {!confirmed && otherConfirmed && (
          <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-center">
            <p className="text-sm text-yellow-400">
              {role === 'giver' ? nextReader.full_name : currentHolder.full_name} confirmed! Your turn.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!confirmed ? (
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-4 bg-[#55B2DE] text-white rounded-xl font-semibold hover:bg-[#4A9FCB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Confirming...' : 'Confirm Handoff'}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold cursor-not-allowed"
          >
            ✓ Confirmed - Waiting for {role === 'giver' ? nextReader.full_name : currentHolder.full_name}
          </button>
        )}
        
        <Link
          href="/support/handoff-issue"
          className="block w-full py-4 border border-white/30 text-white text-center rounded-xl font-semibold hover:bg-white/10 transition-colors"
        >
          Report Issue
        </Link>
      </div>

      {/* Batch Confirm Section */}
      <div className="bg-white/5 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[#55B2DE] font-semibold">Batch Confirm</h3>
            <p className="text-white/50 text-sm">Confirm multiple book handoffs at once</p>
          </div>
          <Link
            href="/handoffs/batch"
            className="px-4 py-2 bg-[#55B2DE] text-white text-sm font-medium rounded-full hover:bg-[#4A9FCB] transition-colors"
          >
            Select Books
          </Link>
        </div>
      </div>

      {/* Recent Handoffs Section */}
      {recentHandoffs && recentHandoffs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Handoffs</h3>
            <Link href="/handoffs" className="text-[#55B2DE] text-sm font-medium hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentHandoffs.map((h) => (
              <div key={h.id} className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                <Avatar
                  avatarType={h.giver.avatar_type}
                  avatarId={h.giver.avatar_id}
                  avatarUrl={h.giver.avatar_url}
                  userName={h.giver.full_name}
                  userId={h.giver.id}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">
                    <span className="font-medium">{h.giver.full_name}</span>
                    <span className="text-white/50"> passed </span>
                    <span className="font-medium">{h.book.title}</span>
                    <span className="text-white/50"> to </span>
                    <span className="font-medium">{h.receiver.full_name}</span>
                  </p>
                  <p className="text-white/40 text-xs">
                    {formatTimeAgo(h.both_confirmed_at)}
                  </p>
                </div>
                {h.book.cover_url && (
                  <div className="flex-shrink-0">
                    <BookCover
                      coverUrl={h.book.cover_url}
                      title={h.book.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

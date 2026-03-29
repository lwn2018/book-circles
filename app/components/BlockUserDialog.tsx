'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  userId: string
  userName: string
  onClose: () => void
  onSuccess?: () => void
}

export default function BlockUserDialog({ userId, userName, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleBlock = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to block a user')
        setLoading(false)
        return
      }

      if (user.id === userId) {
        setError('You cannot block yourself')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: userId
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('This user is already blocked')
        } else {
          console.error('Block error:', insertError)
          setError('Failed to block user. Please try again.')
        }
        setLoading(false)
        return
      }

      // Success
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Block error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1C1C1E] rounded-2xl w-full max-w-sm shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="p-6 pb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            Block {userName}?
          </h2>
          <p className="text-sm text-zinc-400">
            You won't see each other's books, notifications, or activity. You can unblock later in Settings.
          </p>
          {error && (
            <p className="text-sm text-red-400 mt-3">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 flex flex-col gap-2">
          <button
            onClick={handleBlock}
            disabled={loading}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? 'Blocking...' : 'Block'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full px-4 py-3 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:opacity-50 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

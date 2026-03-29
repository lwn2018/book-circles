'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Avatar from '@/app/components/Avatar'

type BlockedUserData = {
  id: string
  blocked_id: string
  blocked_user: Array<{
    id: string
    full_name: string
    avatar_slug?: string
  }> | {
    id: string
    full_name: string
    avatar_slug?: string
  } | null
  created_at: string
}

type Props = {
  blockedUsers: BlockedUserData[]
}

export default function BlockedUsersSection({ blockedUsers: initialBlockedUsers }: Props) {
  const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers)
  const [unblocking, setUnblocking] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Helper to get user data regardless of array or single object
  const getBlockedUser = (blockedUser: BlockedUserData['blocked_user']) => {
    if (!blockedUser) return null
    if (Array.isArray(blockedUser)) return blockedUser[0] || null
    return blockedUser
  }

  const handleUnblock = async (blockedUserId: string, userName: string) => {
    setUnblocking(blockedUserId)
    setShowConfirm(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in')
        setUnblocking(null)
        return
      }

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedUserId)

      if (error) {
        console.error('Unblock error:', error)
        alert('Failed to unblock user')
        setUnblocking(null)
        return
      }

      // Update local state
      setBlockedUsers(prev => prev.filter(bu => bu.blocked_id !== blockedUserId))
      
      // Show toast
      setToast(`${userName} has been unblocked.`)
      setTimeout(() => setToast(null), 4000)
      
      // Refresh page data
      router.refresh()
    } catch (err) {
      console.error('Unblock error:', err)
      alert('An unexpected error occurred')
    } finally {
      setUnblocking(null)
    }
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">Blocked Users</h2>
      
      {blockedUsers.length === 0 ? (
        <div className="bg-[#1E293B] rounded-xl p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#27272A] flex items-center justify-center">
            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-zinc-400">You haven't blocked anyone.</p>
          <p className="text-sm text-zinc-500 mt-1">
            When you block someone, they won't see your books or activity.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {blockedUsers.map((blockedUserRow) => {
            const user = getBlockedUser(blockedUserRow.blocked_user)
            if (!user) return null

            return (
              <div 
                key={blockedUserRow.id}
                className="bg-[#1E293B] rounded-xl p-4 flex items-center gap-4"
              >
                <Avatar
                  avatarSlug={user.avatar_slug}
                  userName={user.full_name}
                  userId={user.id}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-zinc-500">
                    Blocked {new Date(blockedUserRow.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirm(blockedUserRow.blocked_id)}
                  disabled={unblocking === blockedUserRow.blocked_id}
                  className="px-4 py-2 text-sm text-[#55B2DE] hover:text-[#6BC4EC] font-medium disabled:opacity-50 transition-colors"
                >
                  {unblocking === blockedUserRow.blocked_id ? 'Unblocking...' : 'Unblock'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirm(null)}
        >
          <div 
            className="bg-[#1C1C1E] rounded-2xl w-full max-w-sm shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <h3 className="text-lg font-bold text-white mb-2">Unblock this user?</h3>
              <p className="text-sm text-zinc-400">
                They'll be able to see your books and activity again.
              </p>
            </div>
            <div className="p-6 pt-0 flex flex-col gap-2">
              <button
                onClick={() => {
                  const userRow = blockedUsers.find(bu => bu.blocked_id === showConfirm)
                  const user = userRow ? getBlockedUser(userRow.blocked_user) : null
                  if (user) {
                    handleUnblock(showConfirm, user.full_name)
                  }
                }}
                className="w-full px-4 py-3 bg-[#55B2DE] text-white rounded-lg hover:bg-[#4A9FCB] font-medium transition-colors"
              >
                Unblock
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="w-full px-4 py-3 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm">{toast}</span>
        </div>
      )}
    </section>
  )
}

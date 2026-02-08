'use client'

import Link from 'next/link'
import NotificationBell from './NotificationBell'
import UserMenu from './UserMenu'
import AddBookButton from '../library/AddBookButton'

type Circle = {
  id: string
  name: string
}

type AppHeaderProps = {
  user: {
    id: string
    email: string
    full_name?: string | null
    avatar_url?: string | null
  }
  userCircles: Circle[]
}

// Convert null to undefined for UserMenu compatibility
const normalizeUser = (user: AppHeaderProps['user']) => ({
  id: user.id,
  email: user.email,
  full_name: user.full_name ?? undefined,
  avatar_url: user.avatar_url ?? undefined,
})

export default function AppHeader({ user, userCircles }: AppHeaderProps) {
  const normalizedUser = normalizeUser(user)
  
  return (
    <div className="bg-white border-b z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <Link href="/circles" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl">📚</span>
            <span className="font-bold text-lg hidden sm:inline">PagePass</span>
          </Link>

          {/* Right: Search + Add Book + Bell + User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Icon */}
            <button
              onClick={() => {
                // Trigger search overlay
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('openSearch'))
                }
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Search"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            <AddBookButton userId={user.id} userCircles={userCircles} />
            <NotificationBell />
            <UserMenu user={normalizedUser} />
          </div>
        </div>
      </div>
    </div>
  )
}

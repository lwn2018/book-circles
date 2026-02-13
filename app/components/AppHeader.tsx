'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  const pathname = usePathname()
  const router = useRouter()
  
  // Detect if we're on a circle detail page
  const isCircleDetailPage = pathname?.match(/^\/circles\/[^/]+$/) && !pathname.endsWith('/create') && !pathname.endsWith('/join')
  
  return (
    <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Back button on circle detail, otherwise Search Icon */}
          {isCircleDetailPage ? (
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:opacity-80 transition text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-sm hidden sm:inline">Back</span>
            </button>
          ) : (
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
          )}

          {/* Center: Add Book Button */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <AddBookButton userId={user.id} userCircles={userCircles} />
          </div>

          {/* Right: Bell + User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <UserMenu user={normalizedUser} />
          </div>
        </div>
      </div>
    </div>
  )
}

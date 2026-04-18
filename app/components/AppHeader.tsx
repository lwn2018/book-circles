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
    avatar_type?: string | null
    avatar_id?: string | null
    avatar_slug?: string | null
  }
  userCircles: Circle[]
}

// Convert null to undefined for UserMenu compatibility
const normalizeUser = (user: AppHeaderProps['user']) => ({
  id: user.id,
  email: user.email,
  full_name: user.full_name ?? undefined,
  avatar_url: user.avatar_url ?? undefined,
  avatar_type: user.avatar_type ?? undefined,
  avatar_id: user.avatar_id ?? undefined,
  avatar_slug: user.avatar_slug ?? undefined,
})

export default function AppHeader({ user, userCircles }: AppHeaderProps) {
  const normalizedUser = normalizeUser(user)
  const pathname = usePathname()
  const router = useRouter()
  
  // Detect if we're on a circle detail page
  const isCircleDetailPage = pathname?.match(/^\/circles\/[^/]+$/) && !pathname.endsWith('/create') && !pathname.endsWith('/join')
  
  // Circle detail page: simple back arrow only, no other header elements
  if (isCircleDetailPage) {
    return (
      <div className="bg-[#121212] sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <button 
              onClick={() => router.back()}
              className="flex items-center hover:opacity-80 transition text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Default header for other pages - using 3-column grid for proper spacing
  return (
    <div className="bg-[#121212] border-b border-[#334155] sticky top-0 z-40 shadow-sm pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center h-16 gap-3">
          {/* Left: Search Icon */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('openSearch'))
              }
            }}
            className="p-2 rounded-lg hover:bg-[#1E1E1E] transition"
            aria-label="Search"
          >
            <svg className="w-6 h-6 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Center: Add Book Button */}
          <div className="flex justify-center">
            <AddBookButton userId={user.id} userCircles={userCircles} />
          </div>

          {/* Right: Bell + User Menu */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu user={normalizedUser} />
          </div>
        </div>
      </div>
    </div>
  )
}

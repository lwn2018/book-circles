'use client'

import Link from 'next/link'
import NotificationBell from './NotificationBell'
import UserMenu from './UserMenu'

type AppHeaderProps = {
  user: {
    id: string
    email: string
    full_name?: string | null
    avatar_url?: string | null
  }
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

// Convert null to undefined for UserMenu compatibility
const normalizeUser = (user: AppHeaderProps['user']) => ({
  id: user.id,
  email: user.email,
  full_name: user.full_name ?? undefined,
  avatar_url: user.avatar_url ?? undefined,
})

export default function AppHeader({ user, title, subtitle, actions }: AppHeaderProps) {
  const normalizedUser = normalizeUser(user)
  
  return (
    <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo/Brand */}
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl">📚</span>
            <span className="font-bold text-lg hidden sm:inline">Book Circles</span>
          </Link>

          {/* Center: Title (if provided) */}
          {title && (
            <div className="hidden md:block text-center flex-1">
              <h1 className="text-lg font-semibold">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          )}

          {/* Right: Actions + Bell + User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {actions}
            <NotificationBell />
            <UserMenu user={normalizedUser} />
          </div>
        </div>
      </div>
    </div>
  )
}

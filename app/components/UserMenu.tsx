'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import Avatar from './Avatar'

type User = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  avatar_type?: string
  avatar_id?: string
}

export default function UserMenu({ user }: { user: User }) {
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2"
      >
        {/* Avatar */}
        <Avatar
          avatarType={user.avatar_type as any}
          avatarId={user.avatar_id}
          avatarUrl={user.avatar_url}
          userName={user.full_name || user.email}
          userId={user.id}
          size="sm"
        />
        
        {/* Name */}
        <span className="text-sm font-medium hidden sm:block">
          {user.full_name || user.email}
        </span>

        {/* Dropdown arrow */}
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.full_name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            
            <Link
              href="/settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setShowMenu(false)}
            >
              ⚙️ Settings
            </Link>
            
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              🚪 Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

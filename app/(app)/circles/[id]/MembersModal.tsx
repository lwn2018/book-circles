'use client'

import { useState } from 'react'
import Link from 'next/link'
import Avatar from '@/app/components/Avatar'
import UserActionsMenu from '@/app/components/UserActionsMenu'

type Member = {
  user_id: string
  role: string
  profiles: {
    id: string
    full_name: string | null
    avatar_slug: string | null
  } | null
}

type Props = {
  members: Member[]
  currentUserId: string
  circleName: string
}

export default function MembersModal({ members, currentUserId, circleName }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Clickable trigger area */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex -space-x-3">
          {members.slice(0, 5).map((member, index) => (
            <div key={member.user_id} className="relative" style={{ zIndex: 5 - index }}>
              <Avatar
                avatarSlug={member.profiles?.avatar_slug}
                userName={member.profiles?.full_name || 'Member'}
                userId={member.profiles?.id || ''}
                size="sm"
                className="border-2 border-[#121212]"
              />
            </div>
          ))}
          {members.length > 5 && (
            <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center text-[#94A3B8] text-sm font-medium border-2 border-[#121212]">
              +{members.length - 5}
            </div>
          )}
        </div>
        <span className="text-[#94A3B8] text-sm">{members.length} Active Members</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal content */}
          <div 
            className="relative w-full max-w-lg bg-[#1E293B] rounded-t-2xl max-h-[70vh] flex flex-col"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h2 className="text-lg font-semibold text-white">{circleName} Members</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Member list */}
            <div className="overflow-y-auto flex-1 p-4">
              <div className="space-y-3">
                {members.map((member) => (
                  <div 
                    key={member.user_id}
                    className="flex items-center justify-between p-3 bg-[#27272A] rounded-xl"
                  >
                    <Link 
                      href={`/profile/${member.profiles?.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => setIsOpen(false)}
                    >
                      <Avatar
                        avatarSlug={member.profiles?.avatar_slug}
                        userName={member.profiles?.full_name || 'Member'}
                        userId={member.profiles?.id || ''}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {member.profiles?.full_name || 'Unknown'}
                          {member.user_id === currentUserId && (
                            <span className="text-[#55B2DE] text-sm ml-2">(you)</span>
                          )}
                        </p>
                        {member.role === 'admin' && (
                          <p className="text-xs text-[#55B2DE]">Admin</p>
                        )}
                      </div>
                    </Link>
                    
                    {member.user_id !== currentUserId && (
                      <UserActionsMenu
                        userId={member.user_id}
                        userName={member.profiles?.full_name || 'Member'}
                        currentUserId={currentUserId}
                        onBlockSuccess={() => setIsOpen(false)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

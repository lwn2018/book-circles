'use client'

import { useState } from 'react'
import Avatar from '@/app/components/Avatar'
import UserActionsMenu from '@/app/components/UserActionsMenu'
import { useRouter } from 'next/navigation'

type Member = {
  id: string
  profiles: {
    id: string
    full_name: string
    avatar_slug?: string
  }
}

type Props = {
  members: Member[]
  currentUserId: string
}

export default function CollapsibleMembersList({ members, currentUserId }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const displayedMembers = isExpanded ? members : members.slice(0, 6)
  const remainingCount = members.length - 6

  const handleBlockSuccess = () => {
    // Refresh the page to update the members list
    router.refresh()
  }

  return (
    <div className="bg-[#27272A] rounded-xl p-4">
      <h2 className="text-lg font-semibold text-white mb-4 font-arimo">
        Members ({members.length})
      </h2>
      
      <div className="flex flex-wrap gap-3">
        {displayedMembers.map((member) => (
          <div 
            key={member.id} 
            className="relative flex flex-col items-center gap-1.5 group"
          >
            <Avatar
              avatarSlug={member.profiles.avatar_slug}
              userName={member.profiles.full_name}
              userId={member.profiles.id}
              size="md"
            />
            <span className="text-xs text-gray-400 max-w-[60px] truncate text-center">
              {member.profiles.full_name.split(' ')[0]}
            </span>
            
            {/* Actions menu - only show for other users */}
            {member.profiles.id !== currentUserId && (
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <UserActionsMenu
                  userId={member.profiles.id}
                  userName={member.profiles.full_name}
                  currentUserId={currentUserId}
                  onBlockSuccess={handleBlockSuccess}
                  buttonClassName="bg-zinc-800/90 w-6 h-6 p-0.5"
                />
              </div>
            )}
          </div>
        ))}
        
        {!isExpanded && remainingCount > 0 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="w-12 h-12 rounded-full bg-[#3F3F46] flex items-center justify-center text-white font-semibold text-sm hover:bg-[#52525B] transition-colors">
              +{remainingCount}
            </div>
            <span className="text-xs text-gray-400">more</span>
          </button>
        )}
      </div>
      
      {isExpanded && members.length > 6 && (
        <button
          onClick={() => setIsExpanded(false)}
          className="mt-4 text-sm text-[#55B2DE] hover:text-[#6BC4EC] transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  )
}

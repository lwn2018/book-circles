'use client'

import { useState } from 'react'

type Member = {
  id: string
  profiles: {
    id: string
    full_name: string
  }
}

type Props = {
  members: Member[]
}

// Generate avatar color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-[#55B2DE]',
    'bg-amber-500', 
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function CollapsibleMembersList({ members }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const displayedMembers = isExpanded ? members : members.slice(0, 6)
  const remainingCount = members.length - 6

  return (
    <div className="bg-[#27272A] rounded-xl p-4">
      <h2 className="text-lg font-semibold text-white mb-4 font-arimo">
        Members ({members.length})
      </h2>
      
      <div className="flex flex-wrap gap-3">
        {displayedMembers.map((member) => (
          <div 
            key={member.id} 
            className="flex flex-col items-center gap-1.5"
          >
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(member.profiles.full_name)}`}
            >
              {getInitials(member.profiles.full_name)}
            </div>
            <span className="text-xs text-gray-400 max-w-[60px] truncate text-center">
              {member.profiles.full_name.split(' ')[0]}
            </span>
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

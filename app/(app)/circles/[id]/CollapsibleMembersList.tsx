'use client'

import { useState } from 'react'

type Member = {
  id: string
  profiles: {
    full_name: string
  }
}

type Props = {
  members: Member[]
}

export default function CollapsibleMembersList({ members }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mt-6 sm:mt-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left text-base sm:text-lg font-semibold mb-3 hover:text-gray-700 transition"
      >
        <span>Members ({members.length})</span>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="text-sm">
              <p className="font-medium">{member.profiles.full_name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

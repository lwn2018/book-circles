'use client'

import { useState } from 'react'

interface InviteLinkProps {
  inviteCode: string
  variant?: 'default' | 'pill'
}

export default function InviteLink({ inviteCode, variant = 'default' }: InviteLinkProps) {
  const [copied, setCopied] = useState(false)

  const copyInviteLink = () => {
    const url = `${window.location.origin}/join?code=${inviteCode}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback for older browsers
      alert(`Copy this link: ${url}`)
    })
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={copyInviteLink}
        className="px-4 py-2 rounded-full border border-[#334155] bg-transparent text-[#94A3B8] hover:bg-[#1E293B] hover:text-white transition-colors text-sm font-medium"
      >
        {copied ? '✓ Copied!' : '+ Invite'}
      </button>
    )
  }

  return (
    <div className="text-sm text-gray-400 flex items-center gap-2">
      <span>Invite friends:</span>
      <button
        onClick={copyInviteLink}
        className="font-mono font-semibold text-[#55B2DE] hover:text-[#6BC4EC] underline transition-colors"
      >
        {inviteCode}
      </button>
      {copied ? (
        <span className="text-xs text-green-400 font-medium">✓ Copied!</span>
      ) : (
        <span className="text-xs text-gray-500">(tap to copy)</span>
      )}
    </div>
  )
}

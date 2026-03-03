'use client'

import { useState } from 'react'

export default function InviteLink({ inviteCode }: { inviteCode: string }) {
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

  return (
    <div className="text-sm text-gray-400 flex items-center gap-2">
      <span>Invite friends:</span>
      <button
        onClick={copyInviteLink}
        className="font-mono font-semibold text-orange-400 hover:text-orange-300 underline transition-colors"
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

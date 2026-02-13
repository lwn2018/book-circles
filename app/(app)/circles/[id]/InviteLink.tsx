'use client'

import { useState } from 'react'

export default function InviteLink({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false)

  const copyInviteLink = () => {
    const url = `${window.location.origin}/circles/join?code=${inviteCode}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback for older browsers
      alert(`Copy this link: ${url}`)
    })
  }

  return (
    <div className="text-sm text-gray-500 flex items-center gap-2">
      <span>Invite friends:</span>
      <button
        onClick={copyInviteLink}
        className="font-mono font-semibold text-blue-600 hover:text-blue-700 underline"
      >
        {inviteCode}
      </button>
      {copied ? (
        <span className="text-xs text-green-600 font-medium">✓ Copied!</span>
      ) : (
        <span className="text-xs">(tap to copy)</span>
      )}
    </div>
  )
}

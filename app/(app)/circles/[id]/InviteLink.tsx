'use client'

import { useState } from 'react'

interface InviteLinkProps {
  inviteCode: string
  circleName?: string
  variant?: 'default' | 'pill'
}

export default function InviteLink({ inviteCode, circleName, variant = 'default' }: InviteLinkProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  const handleInvite = async () => {
    const url = `${window.location.origin}/join?code=${inviteCode}`
    const shareText = circleName 
      ? `Join my book circle "${circleName}" on PagePass!`
      : 'Join my book circle on PagePass!'
    
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my PagePass Circle',
          text: shareText,
          url: url,
        })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
        return
      } catch (err) {
        // User cancelled or share failed, fall through to clipboard
        if ((err as Error).name === 'AbortError') {
          return // User cancelled, don't show anything
        }
      }
    }
    
    // Fallback to clipboard copy (desktop or share unavailable)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Final fallback for older browsers
      alert(`Copy this link: ${url}`)
    }
  }

  const buttonText = shared ? '✓ Shared!' : copied ? '✓ Copied!' : '+ Invite'

  if (variant === 'pill') {
    return (
      <button
        onClick={handleInvite}
        className="px-4 py-2 rounded-full border border-[#334155] bg-transparent text-[#94A3B8] hover:bg-[#1E293B] hover:text-white transition-colors text-sm font-medium"
      >
        {buttonText}
      </button>
    )
  }

  return (
    <div className="text-sm text-gray-400 flex items-center gap-2">
      <span>Invite friends:</span>
      <button
        onClick={handleInvite}
        className="font-mono font-semibold text-[#55B2DE] hover:text-[#6BC4EC] underline transition-colors"
      >
        {inviteCode}
      </button>
      {shared ? (
        <span className="text-xs text-green-400 font-medium">✓ Shared!</span>
      ) : copied ? (
        <span className="text-xs text-green-400 font-medium">✓ Copied!</span>
      ) : (
        <span className="text-xs text-gray-500">(tap to share)</span>
      )}
    </div>
  )
}

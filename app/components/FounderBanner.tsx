'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function FounderBanner({ userId }: { userId: string }) {
  const [dismissed, setDismissed] = useState(true) // Start hidden to prevent flash
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkDismissed()
  }, [])

  const checkDismissed = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('founder_banner_dismissed')
        .eq('id', userId)
        .single()

      setDismissed(profile?.founder_banner_dismissed || false)
    } catch (err) {
      console.error('Failed to check banner status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    setDismissed(true)
    
    try {
      await supabase
        .from('profiles')
        .update({ founder_banner_dismissed: true })
        .eq('id', userId)
    } catch (err) {
      console.error('Failed to dismiss banner:', err)
    }
  }

  if (loading || dismissed) return null

  return (
    <div className="mx-4 mb-6 p-4 bg-[#1E293B] border border-[#334155] rounded-xl relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xl leading-none p-1"
        aria-label="Dismiss"
      >
        ×
      </button>
      <p className="text-[#E2E8F0] pr-8">
        <span className="font-medium text-white">You're a founding member.</span>{' '}
        Your feedback shapes what PagePass becomes.{' '}
        <a 
          href="/roadmap" 
          className="text-[#55B2DE] hover:text-[#4A9FCB] font-medium"
        >
          See the roadmap →
        </a>
      </p>
    </div>
  )
}

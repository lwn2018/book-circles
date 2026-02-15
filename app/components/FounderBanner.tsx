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
    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
      <p className="text-gray-800 pr-6">
        <span className="font-medium">You're a founding tester.</span>{' '}
        Your feedback shapes what PagePass becomes.{' '}
        <a 
          href="https://pagepass.notion.site/roadmap" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          See the roadmap →
        </a>
      </p>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RestartOnboardingButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRestartOnboarding = async () => {
    if (!confirm('This will restart the onboarding process. Continue?')) {
      return
    }

    setLoading(true)
    try {
      // Mark onboarding as incomplete
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: false,
          onboarding_completed_at: null
        })
        .eq('id', userId)

      if (error) throw error

      // Redirect to onboarding
      router.push('/onboarding/avatar')
      router.refresh()
    } catch (err: any) {
      console.error('Failed to restart onboarding:', err)
      alert('Failed to restart onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRestartOnboarding}
      disabled={loading}
      className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Restarting...' : '↻ Restart Onboarding'}
    </button>
  )
}

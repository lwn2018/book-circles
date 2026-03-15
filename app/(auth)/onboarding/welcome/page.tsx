'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function OnboardingWelcome() {
  const router = useRouter()
  const supabase = createClient()

  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [circleName, setCircleName] = useState<string | null>(null)
  const [circleId, setCircleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [joiningCircle, setJoiningCircle] = useState(false)

  useEffect(() => {
    const storedCode = localStorage.getItem('pendingCircleJoin') || localStorage.getItem('pagepass_invite_code')
    const storedName = localStorage.getItem('pagepass_invite_circle_name')

    if (storedCode) {
      setInviteCode(storedCode)
      setCircleName(storedName)
      fetchCircleId(storedCode)
    }
  }, [])

  const fetchCircleId = async (code: string) => {
    try {
      const { data: circle } = await supabase
        .from('circles')
        .select('id, name')
        .eq('invite_code', code.toUpperCase())
        .single()

      if (circle) {
        setCircleId(circle.id)
        setCircleName(circle.name)
      }
    } catch (err) {
      console.error('Failed to fetch circle:', err)
    }
  }

  const handleGoToCircle = async () => {
    if (!circleId || !inviteCode) return
    setJoiningCircle(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: existing } = await supabase
        .from('circle_members')
        .select('id')
        .eq('circle_id', circleId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        const { error: memberError } = await supabase
          .from('circle_members')
          .insert({ circle_id: circleId, user_id: user.id })
        if (memberError) throw memberError

        await fetch('/api/gamification/log-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            eventType: 'circle_joined',
            metadata: { circle_id: circleId, invite_source: 'link' }
          })
        })
      }

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
        .eq('id', user.id)

      localStorage.removeItem('pagepass_invite_code')
      localStorage.removeItem('pagepass_invite_circle_name')
      localStorage.removeItem('pendingCircleJoin')

      window.location.href = `/circles/${circleId}`
    } catch (err: any) {
      console.error('Failed to join circle:', err)
      alert('Failed to join circle. Please try again.')
    } finally {
      setJoiningCircle(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
        .eq('id', user.id)

      window.location.href = '/circles'
    } catch (err) {
      console.error('Failed to complete onboarding:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] px-6 py-8">
      {/* Progress Bar - All complete */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1 h-1 bg-[#55B2DE] rounded-full" />
        <div className="flex-1 h-1 bg-[#55B2DE] rounded-full" />
        <div className="flex-1 h-1 bg-[#55B2DE] rounded-full" />
        <div className="flex-1 h-1 bg-[#55B2DE] rounded-full" />
      </div>
      <p className="text-center text-gray-500 text-sm mb-8">Step 4 of 4</p>

      <div className="max-w-md mx-auto">
        {/* Founder Message Card */}
        <div className="bg-[#1E293B] rounded-2xl p-6 mb-8">
          {/* Book Stack Illustration */}
          <div className="flex justify-center mb-6">
            <span className="text-7xl">📚</span>
          </div>

          <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
            <p>
              I built this because my wife had books on her shelf she didn't even recognize — they'd been lent so many times, nobody remembered whose they were.
            </p>
            <p className="font-medium text-white">Sound familiar?</p>
            <p>
              PagePass is a simple way to share books with people you trust and always know where they are. You're one of the first people to use it, and your fingerprints are going to be all over what this becomes.
            </p>
            <p>
              <span className="font-medium text-white">Here's how to get started:</span> add a few books, join a circle, and lend something. If anything feels off — confusing, slow, or just wrong — tell me. There's a feedback button on every screen, and I read every single message.
            </p>
            <p>Thank you for being here early.</p>
            <p className="text-right text-white font-medium pt-2">— Mathieu</p>
          </div>
        </div>

        {/* CTAs based on invite status */}
        {inviteCode && circleId ? (
          /* Invited via circle link */
          <div className="space-y-3">
            <button
              onClick={handleGoToCircle}
              disabled={joiningCircle}
              className="w-full py-4 bg-[#55B2DE] text-white font-semibold rounded-full hover:bg-[#4A9FCB] disabled:opacity-50 transition-colors text-lg"
            >
              {joiningCircle ? 'Joining...' : `Go to ${circleName || 'Circle'}`}
            </button>
            <button
              onClick={handleCompleteOnboarding}
              disabled={loading || joiningCircle}
              className="w-full py-4 border-2 border-[#333] text-gray-400 rounded-full hover:border-[#55B2DE] hover:text-white disabled:opacity-50 transition-colors"
            >
              Skip for now
            </button>
          </div>
        ) : (
          /* Organic sign-up - no invite */
          <div className="space-y-3">
            <button
              onClick={() => router.push('/circles/create')}
              disabled={loading}
              className="w-full py-4 bg-[#55B2DE] text-white font-semibold rounded-full hover:bg-[#4A9FCB] disabled:opacity-50 transition-colors text-lg"
            >
              Create your first circle
            </button>
            <button
              onClick={handleCompleteOnboarding}
              disabled={loading}
              className="w-full py-4 border-2 border-[#333] text-gray-400 rounded-full hover:border-[#55B2DE] hover:text-white disabled:opacity-50 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Roadmap link */}
        <div className="text-center mt-6">
          <a href="/roadmap" className="text-[#55B2DE] hover:underline text-sm">
            See what's coming → Roadmap
          </a>
        </div>
      </div>
    </div>
  )
}

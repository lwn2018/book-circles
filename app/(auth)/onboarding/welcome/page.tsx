'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ProgressBar from '../components/ProgressBar'

export default function OnboardingWelcome() {
  const router = useRouter()
  const supabase = createClient()

  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [circleName, setCircleName] = useState<string | null>(null)
  const [circleId, setCircleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [joiningCircle, setJoiningCircle] = useState(false)

  useEffect(() => {
    // Check for stored invite code (multiple possible keys for backward compatibility)
    const storedCode = localStorage.getItem('pendingCircleJoin') || localStorage.getItem('pagepass_invite_code')
    const storedName = localStorage.getItem('pagepass_invite_circle_name')

    if (storedCode) {
      setInviteCode(storedCode)
      setCircleName(storedName)
      
      // Look up circle ID from invite code
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

      // Check if already a member
      const { data: existing } = await supabase
        .from('circle_members')
        .select('id')
        .eq('circle_id', circleId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        // Add as member
        const { error: memberError } = await supabase
          .from('circle_members')
          .insert({
            circle_id: circleId,
            user_id: user.id
          })

        if (memberError) throw memberError

        // Log gamification event
        await fetch('/api/gamification/log-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            eventType: 'circle_joined',
            metadata: {
              circle_id: circleId,
              invite_source: 'link'
            }
          })
        })
      }

      // Mark onboarding complete
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user.id)

      // Clear stored invite (all possible keys)
      localStorage.removeItem('pagepass_invite_code')
      localStorage.removeItem('pagepass_invite_circle_name')
      localStorage.removeItem('pendingCircleJoin')

      // Redirect to circle (use window.location to force full page reload with fresh data)
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

      // Mark onboarding complete
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user.id)

      // Force full page reload to fetch fresh profile data
      window.location.href = '/circles'
    } catch (err) {
      console.error('Failed to complete onboarding:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar currentStep={3} />

      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Illustration/Mascot Placeholder */}
        <div className="text-8xl mb-6">📚</div>

        <h1 className="text-3xl font-bold mb-4">Welcome to PagePass</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left space-y-4">
          <p className="text-gray-800 leading-relaxed">
            I built this because my wife had books on her shelf she didn't even recognize — they'd been lent so many times, nobody remembered whose they were.
          </p>
          <p className="text-gray-800 leading-relaxed">
            Sound familiar?
          </p>
          <p className="text-gray-800 leading-relaxed">
            PagePass is a simple way to share books with people you trust and always know where they are. You're one of the first people to use it, and your fingerprints are going to be all over what this becomes.
          </p>
          <p className="text-gray-800 leading-relaxed">
            <strong>Here's how to get started:</strong> add a few books, join a circle, and lend something. If anything feels off — confusing, slow, or just wrong — tell me. There's a feedback button on every screen, and I read every single message.
          </p>
          <p className="text-gray-800 leading-relaxed">
            Thank you for being here early.
          </p>
          <p className="text-right mt-4 text-gray-900 font-medium">— Mathieu</p>
          
          <div className="pt-4 border-t border-blue-200">
            <a 
              href="https://pagepass.notion.site/roadmap" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              See what's coming → Roadmap
            </a>
          </div>
        </div>

        {inviteCode && circleId ? (
          /* Invited via circle link */
          <div className="space-y-3">
            <button
              onClick={handleGoToCircle}
              disabled={joiningCircle}
              className="w-full py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md text-lg"
            >
              {joiningCircle ? 'Joining...' : `Go to ${circleName || 'Circle'}`}
            </button>
            <button
              onClick={handleCompleteOnboarding}
              disabled={loading || joiningCircle}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        ) : (
          /* Organic sign-up */
          <div className="space-y-3">
            <button
              onClick={() => router.push('/circles/create')}
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md text-lg"
            >
              Create your first circle
            </button>
            <button
              onClick={handleCompleteOnboarding}
              disabled={loading}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>

      {/* PWA Prompt (optional - can be dismissable banner) */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h2 className="font-bold text-lg mb-2">💡 Get the full PagePass experience</h2>
        <p className="text-sm text-gray-700 mb-3">
          Add PagePass to your home screen for instant access, notifications, and an app-like experience.
        </p>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>iOS Safari:</strong> Tap the Share button → Add to Home Screen</p>
          <p><strong>Android Chrome:</strong> Tap the menu (⋮) → Add to Home Screen</p>
        </div>
      </div>
    </div>
  )
}

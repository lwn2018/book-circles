'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { trackEvent } from '@/lib/analytics'
import StickyHeader from '@/app/components/StickyHeader'
import { logEvent } from '@/lib/gamification/log-event-action'

function JoinCircleForm() {
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code') || ''
  const [inviteCode, setInviteCode] = useState(codeFromUrl)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [joinedCircleId, setJoinedCircleId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Redirect to signup with circle code preserved
      router.push(`/auth/signup?circleCode=${inviteCode}`)
      return
    }

    // Find circle by invite code
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .select('id, name, owner_id')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (circleError || !circle) {
      setError('Code not correct please enter correct code')
      setLoading(false)
      return
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('circle_members')
      .select('id')
      .eq('circle_id', circle.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      setError('You are already a member of this circle')
      setLoading(false)
      return
    }

    // Add as member
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circle.id,
        user_id: user.id
      })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    // Track circle joined
    trackEvent.circleJoined(circle.id, circle.name, circle.owner_id)

    // Log gamification event
    await logEvent(user.id, 'circle_joined', {
      circle_id: circle.id,
      invite_source: 'code'
    })

    setLoading(false)
    setJoinedCircleId(circle.id)
    setShowSuccess(true)
  }

  const handleContinue = () => {
    if (joinedCircleId) {
      router.push(`/circles/${joinedCircleId}`)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header with back button */}
      <div className="p-4">
        <Link 
          href="/circles" 
          className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--background-card)] transition-colors"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-[var(--foreground)]"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
      </div>

      {/* Main content */}
      <div className="px-6 pb-8">
        <div className="max-w-md mx-auto">
          {/* Title and subtitle */}
          <h1 
            className="text-2xl font-bold mb-2" 
            style={{ color: 'var(--foreground)' }}
          >
            Join a Circle
          </h1>
          <p 
            className="text-base mb-8" 
            style={{ color: 'var(--foreground-muted)' }}
          >
            Join a circle to start borrowing and sharing books.
          </p>

          <form onSubmit={handleJoin} className="space-y-6">
            {/* Invite Code field */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="input font-mono text-lg uppercase"
                placeholder="Enter Code"
                required
              />
              {error ? (
                <p 
                  className="text-sm mt-2"
                  style={{ color: 'var(--destructive, #ef4444)' }}
                >
                  {error}
                </p>
              ) : (
                <p 
                  className="text-sm mt-2"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  Ask the circle owner for the invite code
                </p>
              )}
            </div>

            {/* Join button */}
            <button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="w-full py-4 rounded-full font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--foreground)'
              }}
            >
              {loading ? 'Joining...' : 'Join Circle'}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        >
          <div 
            className="w-full max-w-sm rounded-2xl p-8 text-center"
            style={{ backgroundColor: 'var(--background-card)' }}
          >
            {/* Green checkmark icon */}
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'var(--success)' }}
            >
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Success text */}
            <h2 
              className="text-xl font-bold mb-3"
              style={{ color: 'var(--foreground)' }}
            >
              Successful
            </h2>
            <p 
              className="text-sm mb-8"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Start exploring books and connect with your friends.
            </p>

            {/* Continue button */}
            <button
              onClick={handleContinue}
              className="w-full py-4 rounded-full font-semibold text-base transition-all"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--foreground)'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function JoinCircle() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background)' }}>Loading...</div>}>
      <JoinCircleForm />
    </Suspense>
  )
}

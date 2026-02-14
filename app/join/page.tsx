'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { trackEvent } from '@/lib/analytics'
import { logEvent } from '@/lib/gamification/log-event-action'

function JoinCircleContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<'checking' | 'confirming' | 'joining' | 'error'>('checking')
  const [error, setError] = useState('')
  const [circle, setCircle] = useState<{ id: string; name: string; owner_id: string } | null>(null)

  useEffect(() => {
    const handleJoin = async () => {
      const code = searchParams.get('code')
      
      if (!code) {
        setError('No invite code provided')
        setStatus('error')
        return
      }

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      console.log('[Join] User:', user ? user.id : 'not logged in', 'Code:', code)
      
      if (!user || authError) {
        // Redirect to signin with circle code (signin page has "create account" link)
        console.log('[Join] Redirecting to signin with circleCode:', code)
        window.location.href = `/auth/signin?circleCode=${code}`
        return
      }

      // User is authenticated - look up circle info
      setStatus('checking')

      try {
        // Find circle by invite code
        const { data: circleData, error: circleError } = await supabase
          .from('circles')
          .select('id, name, owner_id')
          .eq('invite_code', code.toUpperCase())
          .single()

        console.log('[Join] Circle lookup:', circleData, circleError)

        if (circleError || !circleData) {
          const errorMsg = circleError?.message || 'Invalid invite code'
          console.error('[Join] Circle lookup failed:', errorMsg)
          setError(errorMsg)
          setStatus('error')
          return
        }

        // Check if already a member
        const { data: existing } = await supabase
          .from('circle_members')
          .select('id')
          .eq('circle_id', circleData.id)
          .eq('user_id', user.id)
          .maybeSingle()

        console.log('[Join] Existing member check:', existing)

        if (existing) {
          // Already a member - just redirect to circle
          console.log('[Join] Already a member, redirecting to circle:', circleData.id)
          window.location.href = `/circles/${circleData.id}`
          return
        }

        // Show confirmation screen
        setCircle(circleData)
        setStatus('confirming')
      } catch (err: any) {
        console.error('[Join] Unexpected error:', err)
        setError(err.message || 'Failed to look up circle')
        setStatus('error')
      }
    }

    handleJoin()
  }, [searchParams, router, supabase])

  const handleAcceptInvite = async () => {
    if (!circle) return
    
    setStatus('joining')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Add as member
      console.log('[Join] Adding user to circle:', circle.id)
      const { error: memberError } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circle.id,
          user_id: user.id
        })

      if (memberError) {
        console.error('[Join] Failed to add member:', memberError)
        setError(memberError.message)
        setStatus('error')
        return
      }

      console.log('[Join] Successfully joined circle!')

      // Track circle joined
      trackEvent.circleJoined(circle.id, circle.name, circle.owner_id)

      // Log gamification event
      await logEvent(user.id, 'circle_joined', {
        circle_id: circle.id,
        invite_source: 'code'
      })

      // Redirect to the circle
      console.log('[Join] Redirecting to circle page:', circle.id)
      window.location.href = `/circles/${circle.id}`
    } catch (err: any) {
      console.error('[Join] Unexpected error:', err)
      setError(err.message || 'Failed to join circle')
      setStatus('error')
    }
  }

  const handleDeclineInvite = () => {
    window.location.href = '/circles'
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Unable to Join Circle</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/circles"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to My Circles
          </a>
        </div>
      </div>
    )
  }

  if (status === 'confirming' && circle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📚</div>
            <h1 className="text-2xl font-bold mb-4">
              Accept your invitation to the {circle.name} circle?
            </h1>
            <p className="text-gray-600">
              You've been invited to join this book circle. Would you like to accept?
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleAcceptInvite}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md text-lg"
            >
              Yes, Join Circle
            </button>
            <button
              onClick={handleDeclineInvite}
              className="w-full py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              No, Maybe Later
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="text-center">
        <div className="animate-spin text-6xl mb-4">📚</div>
        <h1 className="text-2xl font-bold mb-2">
          {status === 'checking' ? 'Checking invite...' : 'Joining circle...'}
        </h1>
        <p className="text-gray-600">Please wait a moment</p>
      </div>
    </div>
  )
}

export default function JoinCircle() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="animate-spin text-6xl">📚</div>
      </div>
    }>
      <JoinCircleContent />
    </Suspense>
  )
}

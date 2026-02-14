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
  const [status, setStatus] = useState<'checking' | 'joining' | 'error'>('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleJoin = async () => {
      const code = searchParams.get('code')
      
      if (!code) {
        setError('No invite code provided')
        setStatus('error')
        return
      }

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Redirect to signup with circle code
        router.push(`/auth/signup?circleCode=${code}`)
        return
      }

      // User is authenticated - join them to the circle
      setStatus('joining')

      try {
        // Find circle by invite code
        const { data: circle, error: circleError } = await supabase
          .from('circles')
          .select('id, name, owner_id')
          .eq('invite_code', code.toUpperCase())
          .single()

        if (circleError || !circle) {
          setError('Invalid invite code')
          setStatus('error')
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
          // Already a member - just redirect to circle
          router.push(`/circles/${circle.id}`)
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
          setStatus('error')
          return
        }

        // Track circle joined
        trackEvent.circleJoined(circle.id, circle.name, circle.owner_id)

        // Log gamification event
        await logEvent(user.id, 'circle_joined', {
          circle_id: circle.id,
          invite_source: 'code'
        })

        // Redirect to the circle
        router.push(`/circles/${circle.id}`)
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'Failed to join circle')
        setStatus('error')
      }
    }

    handleJoin()
  }, [searchParams, router, supabase])

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

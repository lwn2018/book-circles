'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { trackEvent } from '@/lib/analytics'
import { logEvent } from '@/lib/gamification/log-event-action'

function JoinCircleForm() {
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code') || ''
  const [inviteCode, setInviteCode] = useState(codeFromUrl)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('You must be signed in')
      setLoading(false)
      return
    }

    // Find circle by invite code
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .select('id, name, owner_id')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (circleError || !circle) {
      setError('Invalid invite code')
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

    router.push(`/circles/${circle.id}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-6">Join a Book Circle</h1>
        <form onSubmit={handleJoin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Invite Code</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
              placeholder="Enter code"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Ask the circle owner for the invite code
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join Circle'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function JoinCircle() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8">Loading...</div>}>
      <JoinCircleForm />
    </Suspense>
  )
}

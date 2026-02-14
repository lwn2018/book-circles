'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'
import { logEvent } from '@/lib/gamification/log-event-action'

/**
 * Handles auto-joining a circle after email confirmation
 * Checks localStorage for pendingCircleJoin code set during signup
 */
export default function PendingCircleJoinHandler() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handlePendingJoin = async () => {
      // Check if there's a pending circle join
      const pendingCode = localStorage.getItem('pendingCircleJoin')
      if (!pendingCode) return

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Find the circle
        const { data: circle, error: circleError } = await supabase
          .from('circles')
          .select('id, name, owner_id')
          .eq('invite_code', pendingCode.toUpperCase())
          .single()

        if (circleError || !circle) {
          console.error('Circle not found for pending join:', pendingCode)
          localStorage.removeItem('pendingCircleJoin')
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
          // Already a member, just clean up and redirect
          localStorage.removeItem('pendingCircleJoin')
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
          console.error('Failed to join circle:', memberError)
          localStorage.removeItem('pendingCircleJoin')
          return
        }

        // Track events
        trackEvent.circleJoined(circle.id, circle.name, circle.owner_id)
        await logEvent(user.id, 'circle_joined', {
          circle_id: circle.id,
          invite_source: 'signup_flow'
        })

        // Clean up and redirect to the circle
        localStorage.removeItem('pendingCircleJoin')
        router.push(`/circles/${circle.id}`)
        router.refresh()

      } catch (error) {
        console.error('Error handling pending circle join:', error)
        localStorage.removeItem('pendingCircleJoin')
      }
    }

    handlePendingJoin()
  }, [router, supabase])

  // This component doesn't render anything
  return null
}

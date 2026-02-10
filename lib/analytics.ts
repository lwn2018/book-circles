'use client'

import posthog from 'posthog-js'

// Initialize PostHog
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug()
    }
  })
}

export const analytics = {
  // Track event in PostHog and Supabase
  track: async (eventType: string, properties?: Record<string, any>) => {
    // Track in PostHog
    if (typeof window !== 'undefined') {
      posthog.capture(eventType, properties)
    }

    // Also track in Supabase for our own analytics
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, properties })
      })
      if (!response.ok) {
        console.error('Failed to track event in Supabase')
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  },

  // Identify user
  identify: (userId: string, traits?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, traits)
    }
  },

  // Reset on logout
  reset: () => {
    if (typeof window !== 'undefined') {
      posthog.reset()
    }
  }
}

// Convenience functions for common events
export const trackEvent = {
  signup: (userId: string, email: string, source: 'invite' | 'direct', invitedBy?: string) => {
    analytics.track('user_signed_up', { userId, email, source, invitedBy })
  },

  bookAdded: (bookId: string, source: 'barcode' | 'search' | 'manual', hasCover: boolean, circleIds: string[]) => {
    analytics.track('book_added', { bookId, source, hasCover, circleCount: circleIds.length })
  },

  circleCreated: (circleId: string, circleName: string) => {
    analytics.track('circle_created', { circleId, circleName })
  },

  circleJoined: (circleId: string, circleName: string, invitedBy?: string) => {
    analytics.track('circle_joined', { circleId, circleName, invitedBy })
  },

  borrowRequested: (bookId: string, ownerId: string, circleId: string) => {
    analytics.track('borrow_requested', { bookId, ownerId, circleId })
  },

  borrowAccepted: (bookId: string, borrowerId: string, circleId: string) => {
    analytics.track('borrow_accepted', { bookId, borrowerId, circleId })
  },

  borrowDeclined: (bookId: string, borrowerId: string, reason?: string) => {
    analytics.track('borrow_declined', { bookId, borrowerId, reason })
  },

  queueJoined: (bookId: string, queuePosition: number) => {
    analytics.track('queue_joined', { bookId, queuePosition })
  },

  queuePassed: (bookId: string, reason: string, passCount: number) => {
    analytics.track('queue_passed', { bookId, reason, passCount })
  },

  queueAccepted: (bookId: string, queuePosition: number) => {
    analytics.track('queue_accepted', { bookId, queuePosition })
  },

  handoffReady: (bookId: string, nextRecipientId: string) => {
    analytics.track('handoff_ready', { bookId, nextRecipientId })
  },

  handoffConfirmed: (bookId: string, fromUserId: string, toUserId: string) => {
    analytics.track('handoff_confirmed', { bookId, fromUserId, toUserId })
  },

  affiliateLinkClicked: (bookId: string, source: 'bookshop' | 'amazon' | 'indigo' | 'amazon-ca', placement: string) => {
    analytics.track('affiliate_link_clicked', { bookId, source, placement })
  },

  premiumUpgrade: (plan: 'monthly' | 'annual') => {
    analytics.track('premium_upgrade', { plan })
  }
}

/**
 * Gamification Event Logging System
 * Tracks all user activity for stats and badge evaluation
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'

export type EventType =
  // Book lifecycle
  | 'book_added'
  | 'book_removed'
  | 'book_lent'
  | 'book_borrowed'
  | 'book_returned'
  | 'book_passed'
  | 'book_gifted'
  // Handoff flow (spec events)
  | 'borrow_requested'
  | 'borrow_confirmed'
  | 'handoff_confirmed'
  | 'return_confirmed'
  // Circle events
  | 'circle_created'
  | 'circle_joined'
  | 'circle_left'
  // User/invite events
  | 'user_invited'
  | 'invite_converted'
  // Feature events
  | 'off_shelf_toggled'
  | 'gift_given'
  | 'gift_received'
  | 'affiliate_click'
  | 'goodreads_imported'

export type EventMetadata = {
  book_id?: string
  borrower_id?: string
  lender_id?: string
  from_user_id?: string
  to_user_id?: string
  circle_id?: string
  // Price tracking (spec requirement)
  retail_price?: number
  retail_price_cad?: number
  // Source tracking
  source?: string // manual, goodreads, barcode
  invite_source?: string // invite_link, code
  method?: string
  // User references
  inviter_user_id?: string
  invitee_user_id?: string
  returner_id?: string
  recipient_id?: string
  giver_id?: string
  // Chain tracking
  total_chain_length?: number
  days_held?: number
  // Off-shelf
  new_status?: 'on' | 'off'
  // Affiliate tracking
  context?: 'unavailable' | 'post_read' | 'browse' | 'gift'
  previously_borrowed?: boolean
  // Goodreads import stats
  books_imported_count?: number
  books_available_count?: number
  // Allow additional fields
  [key: string]: any
}

/**
 * Log a user event for gamification tracking
 */
export async function logUserEvent(
  userId: string,
  eventType: EventType,
  metadata: EventMetadata = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('user_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        metadata,
        timestamp: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log user event:', error)
      return { success: false, error: error.message }
    }

    // After logging event, check for new badges
    await evaluateBadges(userId, eventType, metadata)

    return { success: true }
  } catch (error) {
    console.error('Event logging error:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Evaluate if user earned any new badges after this event
 */
async function evaluateBadges(
  userId: string,
  eventType: EventType,
  metadata: EventMetadata
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()

    // Get all automatic badges the user hasn't earned yet
    const { data: unearnedBadges } = await supabase
      .from('badges')
      .select('*')
      .eq('trigger_type', 'automatic')
      .eq('is_earnable', true)
      .not('id', 'in', 
        supabase
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', userId)
      )

    if (!unearnedBadges || unearnedBadges.length === 0) return

    // Get user's event history for count-based badges
    const { data: events } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', userId)

    if (!events) return

    // Check each badge
    for (const badge of unearnedBadges) {
      const condition = badge.trigger_condition as any

      let earned = false

      // Count-based triggers
      if (condition.count) {
        const relevantEvents = events.filter(e => e.event_type === condition.event)
        if (relevantEvents.length >= condition.count) {
          earned = true
        }
      }

      // Value-based triggers
      if (condition.amount && condition.event === 'value_shared') {
        const lendingEvents = events.filter(e => 
          e.event_type === 'book_lent' || e.event_type === 'book_gifted'
        )
        const totalValue = lendingEvents.reduce((sum, e) => 
          sum + (e.metadata?.retail_price || 0), 0
        )
        if (totalValue >= condition.amount) {
          earned = true
        }
      }

      // Days held trigger (quick return)
      if (condition.days_held && eventType === 'book_returned') {
        if (metadata.days_held && metadata.days_held <= condition.days_held) {
          earned = true
        }
      }

      // Books in motion (special check)
      if (condition.event === 'books_in_motion') {
        // Check current books_in_motion count
        const { data: booksOut } = await supabase
          .from('books')
          .select('id')
          .eq('owner_id', userId)
          .eq('status', 'borrowed')

        if (booksOut && booksOut.length >= condition.count) {
          earned = true
        }
      }

      // Award badge if earned
      if (earned) {
        await awardBadge(userId, badge.id, {
          earned_via: eventType,
          timestamp: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error('Badge evaluation error:', error)
  }
}

/**
 * Award a badge to a user
 */
export async function awardBadge(
  userId: string,
  badgeId: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()

    // Check if already earned
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single()

    if (existing) {
      return { success: true } // Already earned
    }

    // Award the badge
    const { error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        earned_at: new Date().toISOString(),
        is_displayed: true, // Auto-display new badge
        metadata
      })

    if (error) {
      console.error('Failed to award badge:', error)
      return { success: false, error: error.message }
    }

    // TODO: Send notification to user about new badge

    return { success: true }
  } catch (error) {
    console.error('Badge award error:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get user's gamification stats
 */
export async function getUserStats(userId: string) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get all user events
    const { data: events } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', userId)

    if (!events) return null

    // Get books owned
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .eq('owner_id', userId)

    // Calculate stats
    const stats = {
      books_in_library: books?.length || 0,
      books_in_motion: books?.filter(b => b.status === 'borrowed').length || 0,
      total_books_lent: events.filter(e => e.event_type === 'book_lent').length,
      total_books_borrowed: events.filter(e => e.event_type === 'book_borrowed').length,
      total_books_gifted: events.filter(e => e.event_type === 'book_gifted').length,
      total_value_shared: events
        .filter(e => e.event_type === 'book_lent' || e.event_type === 'book_gifted')
        .reduce((sum, e) => sum + (e.metadata?.retail_price || 0), 0),
      total_value_received: events
        .filter(e => e.event_type === 'book_borrowed')
        .reduce((sum, e) => sum + (e.metadata?.retail_price || 0), 0),
      circles_created: events.filter(e => e.event_type === 'circle_created').length,
      invites_converted: events.filter(e => e.event_type === 'invite_converted').length
    }

    // Get earned badges
    const { data: earnedBadges } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    return {
      ...stats,
      badges: earnedBadges || []
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return null
  }
}

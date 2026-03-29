'use server'

import { createServerSupabaseClient, createServiceRoleClient } from './supabase-server'
import { revalidatePath } from 'next/cache'

/**
 * Report a user
 */
export async function reportUserAction(
  reportedUserId: string,
  reason: string,
  details?: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to report a user' }
  }

  if (user.id === reportedUserId) {
    return { error: 'You cannot report yourself' }
  }

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      reason,
      details: details || null
    })

  if (error) {
    console.error('Report error:', error)
    return { error: 'Failed to submit report' }
  }

  return { success: true }
}

/**
 * Block a user
 */
export async function blockUserAction(
  blockedId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to block a user' }
  }

  if (user.id === blockedId) {
    return { error: 'You cannot block yourself' }
  }

  const { error } = await supabase
    .from('blocked_users')
    .insert({
      blocker_id: user.id,
      blocked_id: blockedId
    })

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { error: 'User is already blocked' }
    }
    console.error('Block error:', error)
    return { error: 'Failed to block user' }
  }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * Unblock a user
 */
export async function unblockUserAction(
  blockedId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to unblock a user' }
  }

  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId)

  if (error) {
    console.error('Unblock error:', error)
    return { error: 'Failed to unblock user' }
  }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * Get blocked user IDs for the current user (bidirectional)
 */
export async function getBlockedUserIdsAction(): Promise<string[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Get users I blocked
  const { data: iBlocked } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', user.id)

  // Get users who blocked me
  const { data: blockedMe } = await supabase
    .from('blocked_users')
    .select('blocker_id')
    .eq('blocked_id', user.id)

  const blockedIds = new Set<string>()
  
  iBlocked?.forEach(row => blockedIds.add(row.blocked_id))
  blockedMe?.forEach(row => blockedIds.add(row.blocker_id))

  return Array.from(blockedIds)
}

/**
 * Check if a block exists between current user and target (either direction)
 */
export async function checkBlockStatusAction(
  targetUserId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data } = await supabase
    .from('blocked_users')
    .select('id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`)
    .limit(1)

  return (data?.length ?? 0) > 0
}

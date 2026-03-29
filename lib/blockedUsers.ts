import { createServerSupabaseClient, createServiceRoleClient } from './supabase-server'

/**
 * Get all blocked user IDs for a user (bidirectional)
 * Returns IDs of users I blocked AND users who blocked me
 */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const supabase = await createServerSupabaseClient()
  
  // Get users I blocked
  const { data: iBlocked, error: error1 } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', userId)

  // Get users who blocked me
  const { data: blockedMe, error: error2 } = await supabase
    .from('blocked_users')
    .select('blocker_id')
    .eq('blocked_id', userId)

  if (error1) console.error('Error fetching users I blocked:', error1)
  if (error2) console.error('Error fetching users who blocked me:', error2)

  const blockedIds = new Set<string>()
  
  iBlocked?.forEach(row => blockedIds.add(row.blocked_id))
  blockedMe?.forEach(row => blockedIds.add(row.blocker_id))

  return Array.from(blockedIds)
}

/**
 * Check if two users have blocked each other (either direction)
 */
export async function isBlocked(userId1: string, userId2: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('blocked_users')
    .select('id')
    .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`)
    .limit(1)

  if (error) {
    console.error('Error checking block status:', error)
    return false
  }

  return (data?.length ?? 0) > 0
}

/**
 * Block a user
 */
export async function blockUser(blockerId: string, blockedId: string): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  
  // Prevent self-blocking
  if (blockerId === blockedId) {
    return { error: 'You cannot block yourself' }
  }

  const { error } = await supabase
    .from('blocked_users')
    .insert({
      blocker_id: blockerId,
      blocked_id: blockedId
    })

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { error: 'User is already blocked' }
    }
    console.error('Error blocking user:', error)
    return { error: 'Failed to block user' }
  }

  return {}
}

/**
 * Unblock a user
 */
export async function unblockUser(blockerId: string, blockedId: string): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)

  if (error) {
    console.error('Error unblocking user:', error)
    return { error: 'Failed to unblock user' }
  }

  return {}
}

/**
 * Report a user
 */
export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  reason: string,
  details?: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  
  // Prevent self-reporting
  if (reporterId === reportedUserId) {
    return { error: 'You cannot report yourself' }
  }

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      reason,
      details: details || null
    })

  if (error) {
    console.error('Error creating report:', error)
    return { error: 'Failed to submit report' }
  }

  return {}
}

/**
 * Get list of users blocked by a user (for Settings page)
 * Returns raw data - caller must handle the array structure of blocked_user
 */
export async function getBlockedUsers(userId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('blocked_users')
    .select(`
      id,
      blocked_id,
      created_at,
      blocked_user:profiles!blocked_users_blocked_id_fkey (
        id,
        full_name,
        avatar_slug
      )
    `)
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching blocked users:', error)
    return []
  }

  return data || []
}

/**
 * Filter an array of user IDs to exclude blocked users
 */
export async function filterBlockedUserIds(userId: string, userIds: string[]): Promise<string[]> {
  const blockedIds = await getBlockedUserIds(userId)
  const blockedSet = new Set(blockedIds)
  return userIds.filter(id => !blockedSet.has(id))
}

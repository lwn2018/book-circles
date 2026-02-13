'use server'

import { createServerSupabaseClient } from './supabase-server'

/**
 * Check if user's email is confirmed
 */
export async function isEmailConfirmed(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    
    if (!user) return false
    
    // Check if email_confirmed_at is set
    return !!user.email_confirmed_at
  } catch (error) {
    console.error('Error checking email confirmation:', error)
    return false
  }
}

/**
 * Actions that require email confirmation
 */
export const RESTRICTED_ACTIONS = [
  'request_book',
  'borrow_book',
  'confirm_handoff',
  'create_circle',
  'invite_to_circle'
] as const

export type RestrictedAction = typeof RESTRICTED_ACTIONS[number]

/**
 * Check if action is allowed (email must be confirmed)
 */
export async function canPerformAction(
  userId: string,
  action: RestrictedAction
): Promise<{ allowed: boolean; reason?: string }> {
  const confirmed = await isEmailConfirmed(userId)
  
  if (!confirmed) {
    return {
      allowed: false,
      reason: `Please confirm your email to ${action.replace(/_/g, ' ')}. Check your inbox or resend the confirmation email.`
    }
  }
  
  return { allowed: true }
}

/**
 * Resend confirmation email
 */
export async function resendConfirmationEmail(email: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Supabase will send confirmation email if not already confirmed
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to resend email' }
  }
}

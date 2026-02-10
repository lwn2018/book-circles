import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Don't require auth - user might be logged out by the time this fires
  // Just log the feedback anonymously

  try {
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json({ error: 'Reason required' }, { status: 400 })
    }

    // Log to beta_feedback or a separate deletion_feedback table
    // For now, just log to console and return success
    console.log('[Account Deletion Feedback]', {
      reason,
      user_id: user?.id || 'logged_out',
      timestamp: new Date().toISOString()
    })

    // TODO: Store in database if you want to track this
    // For now, console logging is sufficient

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Deletion feedback error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to log feedback' },
      { status: 500 }
    )
  }
}

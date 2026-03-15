import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Allow logging even without auth (for tracking purposes)
  const userId = user?.id || null

  try {
    const body = await request.json()
    const { event_type, metadata } = body

    if (!event_type) {
      return NextResponse.json({ error: 'event_type required' }, { status: 400 })
    }

    // Insert into user_events table
    const { error } = await supabase
      .from('user_events')
      .insert({
        user_id: userId,
        event_type,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log event:', error)
      // Don't fail the request - logging is fire-and-forget
      return NextResponse.json({ logged: false, error: error.message })
    }

    return NextResponse.json({ logged: true })
  } catch (error: any) {
    console.error('Event logging error:', error)
    return NextResponse.json({ logged: false, error: error.message })
  }
}

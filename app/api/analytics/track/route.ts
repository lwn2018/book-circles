import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { eventType, properties } = await request.json()

    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 })
    }

    // Insert event into analytics_events table
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: user.id,
        event_type: eventType,
        event_data: properties || {}
      })

    if (error) {
      console.error('Analytics tracking error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

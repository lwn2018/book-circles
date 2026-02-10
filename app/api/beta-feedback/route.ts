import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      page_url,
      current_path,
      device_info,
      screen_size,
      app_version,
      feedback_type,
      feedback_text
    } = body

    // Validate required fields
    if (!feedback_text || !page_url || !current_path) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert feedback
    const { error: insertError } = await supabase
      .from('beta_feedback')
      .insert({
        user_id: user.id,
        page_url,
        current_path,
        device_info: device_info || null,
        screen_size: screen_size || null,
        app_version: app_version || null,
        feedback_type: feedback_type || null,
        feedback_text
      })

    if (insertError) {
      console.error('Failed to insert feedback:', insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Beta feedback error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

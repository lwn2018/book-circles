import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// Get user's notifications
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const unreadOnly = searchParams.get('unreadOnly') === 'true'
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) throw error

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    })
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// Create notification (server-side only, for testing)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log('POST /api/notifications - User:', user?.id || 'null', 'Auth error:', authError)

  if (!user || !user.id) {
    return NextResponse.json({ 
      error: 'Unauthorized - No user session found',
      debug: { hasUser: !!user, userId: user?.id || null }
    }, { status: 401 })
  }

  try {
    const { type, title, message, link, data } = await request.json()

    console.log('Creating notification for user:', user.id, 'type:', type)

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type,
        title,
        message,
        link: link || null,
        data: data || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', error)
      throw error
    }

    console.log('Notification created successfully:', notification.id)
    return NextResponse.json({ notification })
  } catch (error: any) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create notification' },
      { status: 500 }
    )
  }
}

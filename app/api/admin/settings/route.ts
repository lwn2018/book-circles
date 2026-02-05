import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // Update or insert setting
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        key,
        value,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Admin settings update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin settings error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // Get setting (public read for ads_enabled)
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ value: data?.value })
  } catch (error: any) {
    console.error('Admin settings error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

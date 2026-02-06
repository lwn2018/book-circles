import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { bookshopId, amazonTag, priority } = body

  try {
    // Update or insert Bookshop.org ID
    if (bookshopId) {
      await supabase
        .from('admin_settings')
        .upsert({
          key: 'bookshop_affiliate_id',
          value: bookshopId,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
    }

    // Update or insert Amazon tag
    if (amazonTag) {
      await supabase
        .from('admin_settings')
        .upsert({
          key: 'amazon_associate_tag',
          value: amazonTag,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
    }

    // Update priority
    await supabase
      .from('admin_settings')
      .upsert({
        key: 'affiliate_priority',
        value: priority,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save affiliate settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

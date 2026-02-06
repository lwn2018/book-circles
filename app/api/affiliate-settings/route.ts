import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  try {
    // Get all affiliate settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['bookshop_affiliate_id', 'amazon_associate_tag', 'affiliate_priority', 'ads_enabled'])

    const settingsMap: Record<string, any> = {}
    settings?.forEach(setting => {
      settingsMap[setting.key] = setting.value
    })

    return NextResponse.json({
      bookshopId: settingsMap.bookshop_affiliate_id || '',
      amazonTag: settingsMap.amazon_associate_tag || '',
      priority: settingsMap.affiliate_priority || 'bookshop',
      adsEnabled: settingsMap.ads_enabled === true
    })
  } catch (error) {
    console.error('Failed to fetch affiliate settings:', error)
    return NextResponse.json(
      { 
        bookshopId: '',
        amazonTag: '',
        priority: 'bookshop',
        adsEnabled: false
      },
      { status: 500 }
    )
  }
}

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  try {
    // Get all affiliate settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['indigo_affiliate_id', 'amazon_associate_tag', 'amazon_ca_associate_tag', 'affiliate_priority', 'ads_enabled'])

    const settingsMap: Record<string, any> = {}
    settings?.forEach(setting => {
      settingsMap[setting.key] = setting.value
    })

    return NextResponse.json({
      indigoId: settingsMap.indigo_affiliate_id || '',
      amazonTag: settingsMap.amazon_associate_tag || '',
      amazonCaTag: settingsMap.amazon_ca_associate_tag || '',
      priority: settingsMap.affiliate_priority || 'indigo',
      adsEnabled: settingsMap.ads_enabled === true
    })
  } catch (error) {
    console.error('Failed to fetch affiliate settings:', error)
    return NextResponse.json(
      { 
        indigoId: '',
        amazonTag: '',
        amazonCaTag: '',
        priority: 'indigo',
        adsEnabled: false
      },
      { status: 500 }
    )
  }
}

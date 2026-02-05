import { createServerSupabaseClient } from './supabase-server'

export async function getAdminSetting(key: string): Promise<any> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    console.error(`Failed to get admin setting ${key}:`, error)
    return null
  }

  return data?.value
}

export async function areAdsEnabled(): Promise<boolean> {
  const value = await getAdminSetting('ads_enabled')
  return value === true
}

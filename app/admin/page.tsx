import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  // Get ad settings
  const { data: adSettings } = await supabase
    .from('admin_settings')
    .select('*')
    .eq('key', 'ads_enabled')
    .single()

  const adsEnabled = adSettings?.value === true

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to App
          </Link>
        </div>

        <AdminDashboard adsEnabled={adsEnabled} />
      </div>
    </div>
  )
}

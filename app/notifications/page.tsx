import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '../components/AppHeader'
import NotificationsList from './NotificationsList'

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user profile for header
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        user={{
          id: user.id,
          email: user.email || '',
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url
        }}
      />

      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
              ← Back to Dashboard
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-sm text-gray-600 mt-1">
                Stay updated on your books, circles, and invites
              </p>
            </div>

            <NotificationsList />
          </div>
        </div>
      </div>
    </div>
  )
}

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NotificationsList from './NotificationsList'

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/circles" className="text-blue-600 hover:underline text-sm">
          ← Back to Circles
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
  )
}

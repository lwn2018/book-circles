import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import StickyHeader from '@/app/components/StickyHeader'
import NotificationsList from './NotificationsList'

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  return (
    <div className="min-h-screen bg-[#121212]">
      <StickyHeader title="Notifications" fallbackHref="/circles" />
      <NotificationsList />
    </div>
  )
}

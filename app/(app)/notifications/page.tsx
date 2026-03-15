import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import BackButton from '@/app/components/BackButton'
import NotificationsList from './NotificationsList'

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <div className="bg-[#1E293B] border-b border-[#333]">
        <div className="px-4 py-4 flex items-center gap-4">
          <BackButton fallbackHref="/circles" />
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Notifications
          </h1>
        </div>
      </div>

      <NotificationsList />
    </div>
  )
}

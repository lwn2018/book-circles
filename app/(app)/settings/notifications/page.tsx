import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import BackButton from '@/app/components/BackButton'
import NotificationSettings from './NotificationSettings'

export default async function NotificationSettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email_notifications, push_notifications')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-6 pb-32">
      <div className="flex items-center gap-4 mb-6">
        <BackButton fallbackHref="/settings" />
        <h1 className="text-xl font-bold text-white">Notification Settings</h1>
      </div>

      <div className="max-w-lg mx-auto">
        <NotificationSettings
          userId={user.id}
          emailNotifications={profile?.email_notifications ?? true}
          pushNotifications={profile?.push_notifications ?? true}
        />
      </div>
    </div>
  )
}

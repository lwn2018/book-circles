import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import StickyHeader from '@/app/components/StickyHeader'
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
    <div className="min-h-screen bg-[#121212] py-6 pb-32">
      <StickyHeader title="Notification Settings" fallbackHref="/settings" />
      <div className="px-4">

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

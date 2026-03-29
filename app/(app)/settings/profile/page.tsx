import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import StickyHeader from '@/app/components/StickyHeader'
import AvatarSection from '../AvatarSection'
import SettingsForm from '../SettingsForm'

export default async function EditProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#121212] pb-32">
      <StickyHeader title="Edit Profile" fallbackHref="/settings" />
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <AvatarSection
          userId={user.id}
          userName={profile?.full_name || user.email || 'User'}
          currentAvatarSlug={profile?.avatar_slug || null}
        />

        <div className="bg-[#1E293B] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
          <SettingsForm 
            user={{
              id: user.id,
              email: user.email || '',
              full_name: profile?.full_name || '',
              avatar_url: profile?.avatar_url || '',
              contact_preference_type: profile?.contact_preference_type || null,
              contact_preference_value: profile?.contact_preference_value || '',
              contact_email: profile?.contact_email || null,
              contact_phone: profile?.contact_phone || null,
              default_browse_view: profile?.default_browse_view || 'card'
            }}
          />
        </div>
      </div>
    </div>
  )
}

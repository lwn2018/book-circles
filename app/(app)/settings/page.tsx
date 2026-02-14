import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SettingsForm from './SettingsForm'
import DownloadDataSection from './DownloadDataSection'
import CloseAccountSection from './CloseAccountSection'
import CircleManagementSection from './CircleManagementSection'
import AvatarSection from './AvatarSection'
import RestartOnboardingButton from './RestartOnboardingButton'

export default async function Settings() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's circles
  const { data: memberCircles } = await supabase
    .from('circle_members')
    .select(`
      circle_id,
      circles (
        id,
        name,
        description,
        owner_id
      )
    `)
    .eq('user_id', user.id)

  const circles = memberCircles?.map(m => m.circles).filter(Boolean) || []

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Avatar Section */}
        <div className="mb-8">
          <AvatarSection
            userId={user.id}
            userName={profile?.full_name || user.email || 'User'}
            currentAvatarUrl={profile?.avatar_url || null}
            currentAvatarType={profile?.avatar_type as 'upload' | 'preset' | 'initials' | null}
            currentAvatarId={profile?.avatar_id || null}
          />
        </div>

        <SettingsForm 
          user={{
            id: user.id,
            email: user.email || '',
            full_name: profile?.full_name || '',
            avatar_url: profile?.avatar_url || '',
            contact_preference_type: profile?.contact_preference_type || null,
            contact_preference_value: profile?.contact_preference_value || '',
            default_browse_view: profile?.default_browse_view || 'card'
          }}
        />

        {/* Onboarding Section */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Onboarding</h3>
              <p className="text-sm text-gray-600">
                Revisit the welcome flow and setup screens
              </p>
            </div>
            <RestartOnboardingButton userId={user.id} />
          </div>
        </div>

        {/* Circle Management Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Circle Management</h2>
          <CircleManagementSection circles={circles as any} userId={user.id} />
        </div>

        {/* Data & Privacy Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Data & Privacy</h2>
          
          <DownloadDataSection />
          <CloseAccountSection userEmail={user.email || ''} />
        </div>

        {/* Amazon Associate Disclosure */}
        <footer className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex justify-center gap-4 mb-3">
            <Link href="/privacy" className="text-xs text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            <span className="text-xs text-gray-400">•</span>
            <Link href="/terms" className="text-xs text-blue-600 hover:underline">
              Terms of Service
            </Link>
          </div>
          <p className="text-xs text-gray-500 text-center">
            As an Amazon Associate PagePass earns from qualifying purchases.
          </p>
        </footer>
      </div>
    </div>
  )
}

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/app/components/BackButton'
import SettingsForm from './SettingsForm'
import DownloadDataSection from './DownloadDataSection'
import CloseAccountSection from './CloseAccountSection'
import CircleManagementSection from './CircleManagementSection'
import AvatarSection from './AvatarSection'
import RestartOnboardingButton from './RestartOnboardingButton'

export default async function Settings() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: memberCircles } = await supabase
    .from('circle_members')
    .select(`circle_id, circles (id, name, description, owner_id)`)
    .eq('user_id', user.id)

  const circles = memberCircles?.map(m => m.circles).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <BackButton fallbackHref="/circles" />
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Settings
        </h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <AvatarSection
          userId={user.id}
          userName={profile?.full_name || user.email || 'User'}
          currentAvatarUrl={profile?.avatar_url || null}
          currentAvatarType={profile?.avatar_type as 'upload' | 'preset' | 'initials' | null}
          currentAvatarId={profile?.avatar_id || null}
        />

        <div className="bg-[#1E293B] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Profile Information
          </h2>
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

        <Link href="/library/import" className="block bg-[#1E293B] rounded-xl p-6 hover:bg-[#27272A] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#27272A] rounded-full flex items-center justify-center text-2xl">📚</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Goodreads Import</h3>
                <p className="text-sm text-[#9CA3AF]">Import or add more books from your Goodreads library</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <div className="bg-[#1E293B] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Onboarding</h3>
              <p className="text-sm text-[#9CA3AF]">Revisit the welcome flow and setup screens</p>
            </div>
            <RestartOnboardingButton userId={user.id} />
          </div>
        </div>

        <div className="bg-[#1E293B] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Circle Management
          </h2>
          <CircleManagementSection circles={circles as any} userId={user.id} />
        </div>

        <div className="bg-[#1E293B] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Data & Privacy
          </h2>
          <DownloadDataSection />
          <div className="mt-6">
            <CloseAccountSection userEmail={user.email || ''} />
          </div>
        </div>

        <footer className="pt-6 pb-24 text-center">
          <div className="flex justify-center gap-4 mb-3">
            <Link href="/privacy" className="text-xs text-[#55B2DE] hover:text-[#6BC4EC]">Privacy Policy</Link>
            <span className="text-xs text-[#6B7280]">•</span>
            <Link href="/terms" className="text-xs text-[#55B2DE] hover:text-[#6BC4EC]">Terms of Service</Link>
          </div>
          <p className="text-xs text-[#6B7280]">As an Amazon Associate PagePass earns from qualifying purchases.</p>
        </footer>
      </div>
    </div>
  )
}

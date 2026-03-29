import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import StickyHeader from '@/app/components/StickyHeader'
import DownloadDataSection from '../DownloadDataSection'
import CloseAccountSection from '../CloseAccountSection'
import RestartOnboardingButton from '../RestartOnboardingButton'

export default async function AccountSettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  return (
    <div className="min-h-screen bg-[#121212] py-6 pb-32">
      <StickyHeader title="Account Settings" fallbackHref="/settings" />
      <div className="px-4">

      <div className="max-w-lg mx-auto space-y-6">
        {/* Email Display */}
        <div className="bg-[#1E293B] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Email</h2>
          <p className="text-white/80">{user.email}</p>
          <p className="text-white/40 text-sm mt-1">
            Contact support to change your email
          </p>
        </div>

        {/* Download Data */}
        <DownloadDataSection />

        {/* Restart Onboarding (dev/debug) */}
        <div className="bg-[#1E293B] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Developer Options</h2>
          <p className="text-white/50 text-sm mb-4">
            Reset your onboarding experience (for testing)
          </p>
          <RestartOnboardingButton userId={user.id} />
        </div>

        {/* Danger Zone */}
        <CloseAccountSection userEmail={user.email || ''} />
      </div>
    </div>
  )
}

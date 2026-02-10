import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SettingsForm from './SettingsForm'
import DownloadDataSection from './DownloadDataSection'
import CloseAccountSection from './CloseAccountSection'

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

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-8">Settings</h1>

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

        {/* Data & Privacy Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Data & Privacy</h2>
          
          <DownloadDataSection />
          <CloseAccountSection userEmail={user.email || ''} />
        </div>

        {/* Amazon Associate Disclosure */}
        <footer className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            As an Amazon Associate PagePass earns from qualifying purchases.
          </p>
        </footer>
      </div>
    </div>
  )
}

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SettingsForm from './SettingsForm'

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
            avatar_url: profile?.avatar_url || ''
          }}
        />
      </div>
    </div>
  )
}

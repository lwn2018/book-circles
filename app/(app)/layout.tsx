import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user profile for header
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's circles for Add Book button
  const { data: memberships } = await supabase
    .from('circle_members')
    .select('circle_id, circles(id, name)')
    .eq('user_id', user.id)

  const circles = memberships?.map(m => m.circles) || []

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader 
        user={{
          id: user.id,
          email: user.email || '',
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url
        }}
        userCircles={circles as any}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import SearchOverlay from '../components/SearchOverlay'
import BetaFeedbackButton from '../components/BetaFeedbackButton'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const onboardingLaunchDate = new Date('2026-02-13T00:00:00Z')
  const userCreatedAt = new Date(user.created_at)
  
  if (profile && !profile.onboarding_completed && userCreatedAt > onboardingLaunchDate) {
    redirect('/onboarding/avatar')
  }

  const { data: memberships } = await supabase
    .from('circle_members')
    .select('circle_id, circles(id, name)')
    .eq('user_id', user.id)

  const circles = memberships?.map(m => m.circles) || []

  return (
    <div className="min-h-screen bg-[#121212] pb-20">
      <AppHeader 
        user={{
          id: user.id,
          email: user.email || '',
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
          avatar_type: profile?.avatar_type,
          avatar_id: profile?.avatar_id
        }}
        userCircles={circles as any}
      />
      
      <main>
        {children}
      </main>

      <BottomNav />
      <SearchOverlay userId={user.id} />
      <BetaFeedbackButton />
    </div>
  )
}

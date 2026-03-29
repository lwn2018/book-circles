import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import StickyHeader from '@/app/components/StickyHeader'
import CircleManagementSection from '../CircleManagementSection'

export default async function ManageCirclesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  const { data: memberCircles } = await supabase
    .from('circle_members')
    .select(`circle_id, circles (id, name, description, owner_id)`)
    .eq('user_id', user.id)

  const circles = memberCircles?.map(m => m.circles).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-[#121212] py-6 pb-32">
      <StickyHeader title="Manage Circles" fallbackHref="/settings" />
      <div className="px-4">

      <div className="max-w-lg mx-auto">
        <CircleManagementSection
          circles={circles as any}
          userId={user.id}
        />
      </div>
    </div>
  )
}

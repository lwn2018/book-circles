import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import BackButton from '@/app/components/BackButton'
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
    <div className="min-h-screen bg-[#121212] px-4 py-6 pb-32">
      <div className="flex items-center gap-4 mb-6">
        <BackButton fallbackHref="/settings" />
        <h1 className="text-xl font-bold text-white">Manage Circles</h1>
      </div>

      <div className="max-w-lg mx-auto">
        <CircleManagementSection
          circles={circles as any}
          userId={user.id}
        />
      </div>
    </div>
  )
}

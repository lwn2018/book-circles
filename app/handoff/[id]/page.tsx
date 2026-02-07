import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import HandoffCard from './HandoffCard'

export default async function HandoffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get handoff details
  const { data: handoff } = await supabase
    .from('handoff_confirmations')
    .select(`
      *,
      book:books(id, title, cover_url),
      giver:giver_id(
        id, 
        full_name, 
        contact_preference_type, 
        contact_preference_value
      ),
      receiver:receiver_id(
        id, 
        full_name, 
        contact_preference_type, 
        contact_preference_value
      )
    `)
    .eq('id', id)
    .single()

  if (!handoff) {
    redirect('/dashboard')
  }

  // Verify user is part of this handoff
  if (handoff.giver_id !== user.id && handoff.receiver_id !== user.id) {
    redirect('/dashboard')
  }

  const role = handoff.giver_id === user.id ? 'giver' : 'receiver'
  const otherPerson = role === 'giver' 
    ? (handoff.receiver as any) 
    : (handoff.giver as any)

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-md mx-auto">
        <HandoffCard 
          handoff={handoff as any}
          role={role}
          userId={user.id}
          otherPerson={otherPerson}
        />
      </div>
    </div>
  )
}

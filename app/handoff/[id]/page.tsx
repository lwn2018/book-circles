import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
      book:books(id, title, author, cover_url, gift_on_borrow),
      giver:giver_id(
        id, 
        full_name, 
        avatar_type,
        avatar_id,
        avatar_url,
        contact_preference_type, 
        contact_preference_value
      ),
      receiver:receiver_id(
        id, 
        full_name, 
        avatar_type,
        avatar_id,
        avatar_url,
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

  // Get recent handoffs for this user (completed ones)
  const { data: recentHandoffs } = await supabase
    .from('handoff_confirmations')
    .select(`
      id,
      both_confirmed_at,
      book:books(id, title, cover_url),
      giver:giver_id(id, full_name, avatar_type, avatar_id, avatar_url),
      receiver:receiver_id(id, full_name, avatar_type, avatar_id, avatar_url)
    `)
    .not('both_confirmed_at', 'is', null)
    .or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('both_confirmed_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <Link 
          href="/shelf" 
          className="inline-flex items-center text-white/80 hover:text-white mb-4"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="sr-only">Back</span>
        </Link>
        
        <h1 className="text-2xl font-bold text-white">Confirm Handoff</h1>
        <p className="text-white/60 text-sm mt-1">
          Confirm that this book has been passed to the next reader.
        </p>
      </div>

      {/* Main content */}
      <div className="px-4 pb-8">
        <HandoffCard 
          handoff={handoff as any}
          role={role}
          userId={user.id}
          recentHandoffs={recentHandoffs as any}
        />
      </div>
    </div>
  )
}

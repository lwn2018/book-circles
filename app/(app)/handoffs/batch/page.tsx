import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BatchSelector from './BatchSelector'
import StickyHeader from '@/app/components/StickyHeader'

export default async function BatchHandoffPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get all pending handoffs for this user
  const { data: handoffs } = await supabase
    .from('handoff_confirmations')
    .select(`
      id,
      giver_id,
      receiver_id,
      giver_confirmed_at,
      receiver_confirmed_at,
      created_at,
      books:book_id (id, title, author, cover_url, isbn),
      giver:profiles!handoff_confirmations_giver_id_fkey (id, full_name, avatar_type, avatar_id, avatar_url),
      receiver:profiles!handoff_confirmations_receiver_id_fkey (id, full_name, avatar_type, avatar_id, avatar_url)
    `)
    .is('both_confirmed_at', null)
    .or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Split into incoming (user is receiver, needs to confirm pickup) 
  // and outgoing (user is giver, needs to confirm handoff)
  const incoming = handoffs?.filter(h => 
    h.receiver_id === user.id && !h.receiver_confirmed_at
  ) || []
  
  const outgoing = handoffs?.filter(h => 
    h.giver_id === user.id && !h.giver_confirmed_at
  ) || []

  const hasAnyPending = incoming.length > 0 || outgoing.length > 0

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
        
        <h1 className="text-2xl font-bold text-white">Batch Confirm</h1>
        <p className="text-white/60 text-sm mt-1">
          Select multiple books to confirm at once.
        </p>
      </div>

      {/* Main content */}
      <div className="px-4 pb-8">
        {!hasAnyPending ? (
          <div className="bg-white/5 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-white text-lg font-semibold mb-2">
              All caught up!
            </h2>
            <p className="text-white/60 text-sm mb-6">
              You don't have any pending handoffs to confirm.
            </p>
            <Link
              href="/circles"
              className="inline-block px-6 py-3 bg-[#55B2DE] text-white rounded-xl font-medium hover:bg-[#4A9FCB] transition-colors"
            >
              Browse Circles
            </Link>
          </div>
        ) : (
          <BatchSelector 
            incoming={incoming as any}
            outgoing={outgoing as any}
            userId={user.id}
          />
        )}
      </div>
    </div>
  )
}

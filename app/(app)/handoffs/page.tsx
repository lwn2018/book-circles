import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import HandoffCard from './HandoffCard'

export default async function HandoffsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get active handoffs for this user (as giver or receiver)
  const { data: handoffs } = await supabase
    .from('handoff_confirmations')
    .select(`
      *,
      books (
        id,
        title,
        author,
        cover_url
      ),
      giver:profiles!handoff_confirmations_giver_id_fkey (
        id,
        full_name,
        contact_preference_type,
        contact_preference_value
      ),
      receiver:profiles!handoff_confirmations_receiver_id_fkey (
        id,
        full_name,
        contact_preference_type,
        contact_preference_value
      )
    `)
    .is('both_confirmed_at', null)
    .order('created_at', { ascending: false })

  const activeHandoffs = handoffs || []
  const pendingHandoffs = activeHandoffs.filter(h => 
    (h.giver_id === user.id && !h.giver_confirmed_at) ||
    (h.receiver_id === user.id && !h.receiver_confirmed_at)
  )
  const waitingHandoffs = activeHandoffs.filter(h => 
    (h.giver_id === user.id && h.giver_confirmed_at && !h.receiver_confirmed_at) ||
    (h.receiver_id === user.id && h.receiver_confirmed_at && !h.giver_confirmed_at)
  )

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Active Handoffs</h1>
          <p className="text-gray-600 mt-1">
            Coordinate book pickups with circle members
          </p>
        </div>

        {activeHandoffs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No active handoffs</p>
            <p className="text-sm text-gray-500">
              When you borrow or pass a book, it will appear here
            </p>
            <Link
              href="/circles"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Circles
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending (needs your confirmation) */}
            {pendingHandoffs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 text-blue-700">
                  Needs Your Confirmation ({pendingHandoffs.length})
                </h2>
                <div className="space-y-4">
                  {pendingHandoffs.map((handoff: any) => (
                    <HandoffCard
                      key={handoff.id}
                      handoff={handoff}
                      userId={user.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Waiting (other person needs to confirm) */}
            {waitingHandoffs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-600">
                  Waiting for Confirmation ({waitingHandoffs.length})
                </h2>
                <div className="space-y-4">
                  {waitingHandoffs.map((handoff: any) => (
                    <HandoffCard
                      key={handoff.id}
                      handoff={handoff}
                      userId={user.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

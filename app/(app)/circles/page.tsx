import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PendingCircleJoinHandler from './PendingCircleJoinHandler'

export default async function CirclesTab() {
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

  // Get user's circles
  const { data: memberships } = await supabase
    .from('circle_members')
    .select(`
      *,
      circles (
        id,
        name,
        description,
        invite_code,
        owner_id
      )
    `)
    .eq('user_id', user.id)

  const circles = memberships?.map(m => m.circles) || []

  // Get count of books offered to user
  const { count: offersCount } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
    .eq('next_recipient', user.id)
    .eq('status', 'ready_for_next')

  return (
    <div>
      {/* Handle pending circle join from signup flow */}
      <PendingCircleJoinHandler />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Circles</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {profile?.full_name || user.email}!
        </p>
      </div>

      {/* Books Offered Counter */}
      {offersCount !== null && offersCount > 0 && (
        <Link
          href="/dashboard/offers"
          className="block mb-6 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">📬 Books Offered to You</h3>
              <p className="text-sm text-green-700">You have {offersCount} book{offersCount !== 1 ? 's' : ''} waiting!</p>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </Link>
      )}

      {/* Admin Dashboard Link */}
      {profile?.is_admin && (
        <Link
          href="/admin"
          className="block mb-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-block"
        >
          📊 Admin Dashboard
        </Link>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <Link
          href="/circles/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          ➕ Create Circle
        </Link>
        <Link
          href="/circles/join"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          🔗 Join Circle
        </Link>
      </div>

      {/* Circles List */}
      {circles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">You're not in any circles yet.</p>
          <p className="text-sm text-gray-500">A circle is a group of friends who share books. Create one and invite your people — or join one you've been invited to.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {circles.map((circle: any) => (
            <Link
              key={circle.id}
              href={`/circles/${circle.id}`}
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-2">{circle.name}</h2>
              {circle.description && (
                <p className="text-gray-600 mb-2">{circle.description}</p>
              )}
              <p className="text-sm text-gray-500">
                Share this code to invite friends: <span className="font-mono">{circle.invite_code}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

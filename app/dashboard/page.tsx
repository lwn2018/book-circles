import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UserMenu from '../components/UserMenu'
import AddBookButton from '../library/AddBookButton'

export default async function Dashboard() {
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
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Book Circles</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back, {profile?.full_name || user.email}!</p>
          </div>
          <div className="flex items-center gap-3">
            <AddBookButton userId={user.id} userCircles={circles as any} />
            <UserMenu user={{
              id: user.id,
              email: user.email || '',
              full_name: profile?.full_name,
              avatar_url: profile?.avatar_url
            }} />
          </div>
        </div>

        <div className="mb-6 flex gap-4 flex-wrap">
          {profile?.is_admin && (
            <Link
              href="/admin"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              📊 Admin Dashboard
            </Link>
          )}
          <Link
            href="/library"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            📚 My Library
          </Link>
          <Link
            href="/dashboard/offers"
            className={`px-4 py-2 rounded-lg font-medium relative ${
              offersCount && offersCount > 0
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            📬 Books Offered to You
            {offersCount && offersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {offersCount}
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/borrowed"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📖 Borrowed Books
          </Link>
          <Link
            href="/dashboard/owned"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            🏠 Books Lent Out
          </Link>
          <Link
            href="/circles/create"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Create Circle
          </Link>
          <Link
            href="/circles/join"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Join Circle
          </Link>
        </div>

        {circles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">You're not in any circles yet.</p>
            <p className="text-sm text-gray-500">Create a circle or join one with an invite code.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {circles.map((circle: any) => (
              <Link
                key={circle.id}
                href={`/circles/${circle.id}`}
                className="p-6 border rounded-lg hover:border-blue-500 hover:shadow-md transition"
              >
                <h2 className="text-xl font-semibold mb-2">{circle.name}</h2>
                {circle.description && (
                  <p className="text-gray-600 mb-2">{circle.description}</p>
                )}
                <p className="text-sm text-gray-500">
                  Invite code: <span className="font-mono">{circle.invite_code}</span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Avatar from '@/app/components/Avatar'

// Badge icons mapping
const BADGE_ICONS: Record<string, string> = {
  'shelf_starter': '📚',
  'circle_maker': '🌐',
  'first_lend': '🤝',
  'bookworm': '📖',
  'generous_lender': '💝',
  'chain_starter': '🔗',
  'quick_reader': '⚡',
  'default': '🏅'
}

// Activity type descriptions
const ACTIVITY_LABELS: Record<string, { icon: string; text: (metadata: any) => string }> = {
  'book_added': {
    icon: '📚',
    text: (m) => `Added "${m?.title || 'a book'}" to library`
  },
  'book_lent': {
    icon: '📤',
    text: (m) => `Lent "${m?.title || 'a book'}"`
  },
  'book_borrowed': {
    icon: '📥',
    text: (m) => `Borrowed "${m?.title || 'a book'}"`
  },
  'book_returned': {
    icon: '↩️',
    text: (m) => `Returned "${m?.title || 'a book'}"`
  },
  'circle_created': {
    icon: '🌐',
    text: (m) => `Created a new circle`
  },
  'circle_joined': {
    icon: '👋',
    text: (m) => `Joined a circle`
  },
  'book_gifted': {
    icon: '🎁',
    text: (m) => `Gifted "${m?.title || 'a book'}"`
  },
  'handoff_confirmed': {
    icon: '✅',
    text: (m) => `Completed a handoff`
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

function formatMemberSince(dateString: string): string {
  const date = new Date(dateString)
  return `Member since ${date.getFullYear()}`
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: profileId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get the profile being viewed
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  const isOwnProfile = user.id === profileId

  // Get user stats from books table
  const { data: ownedBooks } = await supabase
    .from('books')
    .select('id, status')
    .eq('owner_id', profileId)

  const { data: borrowedBooks } = await supabase
    .from('books')
    .select('id')
    .eq('current_borrower_id', profileId)

  // Count from user_events
  const { data: lendEvents } = await supabase
    .from('user_events')
    .select('id')
    .eq('user_id', profileId)
    .eq('event_type', 'book_lent')

  const stats = {
    booksOwned: ownedBooks?.length || 0,
    booksLent: lendEvents?.length || 0,
    booksBorrowed: borrowedBooks?.length || 0
  }

  // Get user badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`
      *,
      badges (
        id,
        slug,
        name,
        description,
        category
      )
    `)
    .eq('user_id', profileId)
    .order('earned_at', { ascending: false })
    .limit(6)

  // Get recent activity from user_events
  const { data: recentActivity } = await supabase
    .from('user_events')
    .select('*')
    .eq('user_id', profileId)
    .in('event_type', ['book_added', 'book_lent', 'book_borrowed', 'book_returned', 'circle_created', 'circle_joined', 'book_gifted', 'handoff_confirmed'])
    .order('timestamp', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen -mx-4 -my-6 bg-[#121212]">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-sm px-4 py-4">
        <Link 
          href="/circles"
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center px-6 pb-6">
        {/* Avatar with badge overlay */}
        <div className="relative">
          <Avatar
            avatarType={profile.avatar_type}
            avatarId={profile.avatar_id}
            avatarUrl={profile.avatar_url}
            userName={profile.full_name || 'User'}
            userId={profile.id}
            size="lg"
            className="ring-4 ring-[#1E293B]"
          />
          {/* Badge indicator if user has badges */}
          {userBadges && userBadges.length > 0 && (
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#55B2DE] rounded-full flex items-center justify-center text-lg shadow-lg border-2 border-[#121212]">
              {BADGE_ICONS[userBadges[0].badges?.slug || ''] || BADGE_ICONS.default}
            </div>
          )}
        </div>

        {/* Name */}
        <h1 className="mt-4 text-2xl font-bold text-white">
          {profile.full_name || 'Anonymous User'}
        </h1>

        {/* Bio/tagline */}
        {profile.bio ? (
          <p className="mt-2 text-gray-400 text-center max-w-xs">
            {profile.bio}
          </p>
        ) : (
          <p className="mt-2 text-gray-500 text-center italic">
            Fiction lover. Always passing books forward.
          </p>
        )}

        {/* Member since pill */}
        <div className="mt-4 px-4 py-1.5 bg-[#1E293B] rounded-full">
          <span className="text-sm text-gray-300">
            {formatMemberSince(profile.created_at)}
          </span>
        </div>
      </div>

      {/* Reading Stats */}
      <section className="px-4 py-6">
        <h2 className="text-lg font-semibold text-white mb-4">Reading Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1E293B] rounded-xl p-4 text-center shadow-lg">
            <p className="text-2xl font-bold text-[#55B2DE]">{stats.booksOwned}</p>
            <p className="text-sm text-gray-400 mt-1">Books Owned</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4 text-center shadow-lg">
            <p className="text-2xl font-bold text-[#55B2DE]">{stats.booksLent}</p>
            <p className="text-sm text-gray-400 mt-1">Books Lent</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4 text-center shadow-lg">
            <p className="text-2xl font-bold text-[#55B2DE]">{stats.booksBorrowed}</p>
            <p className="text-sm text-gray-400 mt-1">Borrowed</p>
          </div>
        </div>
      </section>

      {/* Badges Section */}
      <section className="px-4 py-6">
        <h2 className="text-lg font-semibold text-white mb-4">Badges</h2>
        {userBadges && userBadges.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {userBadges.slice(0, 3).map((ub) => (
              <div 
                key={ub.id} 
                className="bg-[#1E293B] rounded-xl p-4 text-center shadow-lg"
              >
                <div className="text-3xl mb-2">
                  {BADGE_ICONS[ub.badges?.slug || ''] || BADGE_ICONS.default}
                </div>
                <p className="text-sm font-medium text-white truncate">
                  {ub.badges?.name || 'Badge'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1E293B] rounded-xl p-6 text-center">
            <p className="text-4xl mb-2">🏅</p>
            <p className="text-gray-400">No badges earned yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start lending and borrowing to earn badges!
            </p>
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section className="px-4 py-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        {recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const activityInfo = ACTIVITY_LABELS[activity.event_type] || {
                icon: '📌',
                text: () => activity.event_type.replace(/_/g, ' ')
              }
              return (
                <div 
                  key={activity.id}
                  className="bg-[#1E293B] rounded-xl p-4 flex items-start gap-3"
                >
                  <span className="text-xl">{activityInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">
                      {activityInfo.text(activity.metadata)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-[#1E293B] rounded-xl p-6 text-center">
            <p className="text-gray-400">No recent activity</p>
          </div>
        )}
      </section>

      {/* Bottom Action Buttons */}
      <section className="px-4 py-6 pb-24">
        <div className="grid grid-cols-3 gap-3">
          {isOwnProfile ? (
            <>
              <Link
                href="/settings"
                className="bg-[#1E293B] hover:bg-[#2D3F56] text-white rounded-xl py-3 px-4 text-center text-sm font-medium transition-colors"
              >
                Edit Profile
              </Link>
              <Link
                href="/library"
                className="bg-[#1E293B] hover:bg-[#2D3F56] text-white rounded-xl py-3 px-4 text-center text-sm font-medium transition-colors"
              >
                My Library
              </Link>
              <Link
                href="/shelf"
                className="bg-[#55B2DE] hover:bg-[#4A9BC5] text-white rounded-xl py-3 px-4 text-center text-sm font-medium transition-colors"
              >
                My Shelf
              </Link>
            </>
          ) : (
            <>
              <button
                className="bg-[#1E293B] hover:bg-[#2D3F56] text-white rounded-xl py-3 px-4 text-center text-sm font-medium transition-colors"
              >
                Message
              </button>
              <Link
                href={`/library?user=${profileId}`}
                className="bg-[#1E293B] hover:bg-[#2D3F56] text-white rounded-xl py-3 px-4 text-center text-sm font-medium transition-colors"
              >
                View Books
              </Link>
              <button
                className="bg-[#55B2DE] hover:bg-[#4A9BC5] text-white rounded-xl py-3 px-4 text-center text-sm font-medium transition-colors"
              >
                Borrow
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

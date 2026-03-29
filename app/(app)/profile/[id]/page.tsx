import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StickyHeader from '@/app/components/StickyHeader'
import Avatar from '@/app/components/Avatar'
import ProfileActions from './ProfileActions'

const BADGE_DATA: Record<string, { icon: string; name: string; description: string }> = {
  'shelf_starter': { icon: '📚', name: 'Shelf Starter', description: 'Added first book' },
  'circle_maker': { icon: '🌐', name: 'Circle Champ', description: 'Founded a circle' },
  'first_lend': { icon: '🤝', name: 'First Lend', description: 'Completed first lend' },
  'supporter': { icon: '💝', name: 'Supporter', description: 'Shared over 10 books' },
  'top_lender': { icon: '⭐', name: 'Top Lender', description: 'Highly active circle' },
  'bookworm': { icon: '📖', name: 'Bookworm', description: 'Read 10+ books' },
  'generous_lender': { icon: '💫', name: 'Generous', description: 'Lent 20+ books' },
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: profileId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  // Check if user is blocked
  const { data: blockCheck } = await supabase
    .from('blocked_users')
    .select('id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${profileId}),and(blocker_id.eq.${profileId},blocked_id.eq.${user.id})`)
    .limit(1)

  // If blocked, show limited view or redirect
  const isBlocked = (blockCheck?.length ?? 0) > 0

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (profileError || !profile) notFound()

  const isOwnProfile = user.id === profileId

  // If blocked and not own profile, show blocked message
  if (isBlocked && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-[#121212]">
        <StickyHeader title="Profile" fallbackHref="/circles" />
        <div className="px-4 py-6 flex flex-col items-center justify-center mt-10">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Profile Unavailable</h1>
          <p className="text-zinc-400 text-center max-w-xs">
            This profile is not available to view.
          </p>
        </div>
      </div>
    )
  }

  const { data: ownedBooks } = await supabase.from('books').select('id').eq('owner_id', profileId)
  const { data: lendEvents } = await supabase.from('user_events').select('id').eq('user_id', profileId).eq('event_type', 'book_lent')
  const { data: borrowEvents } = await supabase.from('user_events').select('id').eq('user_id', profileId).eq('event_type', 'book_borrowed')

  const stats = {
    shared: ownedBooks?.length || 0,
    borrowed: borrowEvents?.length || 0,
    totalRead: (lendEvents?.length || 0) + (borrowEvents?.length || 0)
  }

  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`*, badges (id, slug, name, description)`)
    .eq('user_id', profileId)
    .order('earned_at', { ascending: false })
    .limit(3)

  const { data: recentActivity } = await supabase
    .from('user_events')
    .select('*')
    .eq('user_id', profileId)
    .in('event_type', ['book_lent', 'book_borrowed', 'book_returned', 'handoff_confirmed'])
    .order('timestamp', { ascending: false })
    .limit(3)

  const memberYear = new Date(profile.created_at).getFullYear()

  return (
    <div className="min-h-screen bg-[#121212]">
      <StickyHeader fallbackHref="/circles" />
      <div className="px-4 py-6">
      {/* Profile Content */}
      <BackButton fallbackHref="/circles" />

      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8 mt-6">
        <div className="relative">
          <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-[#55B2DE]/30">
            <Avatar
              avatarType={profile.avatar_type}
              avatarId={profile.avatar_id}
              avatarUrl={profile.avatar_url}
              userName={profile.full_name || 'User'}
              userId={profile.id}
              size="lg"
              className="w-full h-full"
            />
          </div>
          {isOwnProfile && (
            <Link href="/settings" className="absolute bottom-0 right-0 w-8 h-8 bg-[#55B2DE] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </Link>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {profile.full_name || 'Anonymous User'}
        </h1>
        <p className="mt-2 text-[#9CA3AF] text-center max-w-xs">
          {profile.bio || '"Fiction lover. Always passing books forward."'}
        </p>
        <div className="mt-4 px-4 py-2 bg-[#1E293B] rounded-full">
          <span className="text-sm text-white">Member since {memberYear}</span>
        </div>

        {/* Report/Block Actions for other users */}
        {!isOwnProfile && (
          <ProfileActions 
            profileId={profileId} 
            profileName={profile.full_name || 'User'} 
            currentUserId={user.id} 
          />
        )}
      </div>

      {/* Reading Stats */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Reading Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{stats.shared}</p>
            <p className="text-xs text-[#55B2DE] uppercase tracking-wide mt-1">Shared</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{stats.borrowed}</p>
            <p className="text-xs text-[#55B2DE] uppercase tracking-wide mt-1">Borrowed</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{stats.totalRead}</p>
            <p className="text-xs text-[#55B2DE] uppercase tracking-wide mt-1">Total Read</p>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Badge</h2>
        <div className="grid grid-cols-3 gap-3">
          {userBadges && userBadges.length > 0 ? (
            userBadges.map((ub) => {
              const badge = BADGE_DATA[ub.badges?.slug || ''] || { icon: '🏅', name: ub.badges?.name || 'Badge', description: '' }
              return (
                <div key={ub.id} className="bg-[#1E293B] rounded-xl p-4 text-center">
                  <p className="font-semibold text-white text-sm mb-1">{badge.name}</p>
                  <p className="text-xs text-[#9CA3AF]">{badge.description}</p>
                </div>
              )
            })
          ) : (
            <>
              <div className="bg-[#1E293B] rounded-xl p-4 text-center opacity-50">
                <p className="font-semibold text-white text-sm mb-1">Supporter</p>
                <p className="text-xs text-[#9CA3AF]">Shared over 10 books</p>
              </div>
              <div className="bg-[#1E293B] rounded-xl p-4 text-center opacity-50">
                <p className="font-semibold text-white text-sm mb-1">Top Lender</p>
                <p className="text-xs text-[#9CA3AF]">Highly active circle</p>
              </div>
              <div className="bg-[#1E293B] rounded-xl p-4 text-center opacity-50">
                <p className="font-semibold text-white text-sm mb-1">Circle Champ</p>
                <p className="text-xs text-[#9CA3AF]">Founded a circle</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((activity) => {
              const metadata = activity.metadata || {}
              let actionText = ''
              if (activity.event_type === 'book_borrowed') actionText = `borrowed "${metadata.title || 'a book'}"`
              else if (activity.event_type === 'book_returned') actionText = `returned "${metadata.title || 'a book'}"`
              else if (activity.event_type === 'book_lent') actionText = `lent "${metadata.title || 'a book'}"`
              else actionText = activity.event_type.replace(/_/g, ' ')
              
              return (
                <div key={activity.id} className="bg-[#1E293B] rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#27272A] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm"><span className="font-semibold">{isOwnProfile ? 'You' : profile.full_name?.split(' ')[0]}</span> {actionText}</p>
                    <p className="text-xs text-[#6B7280] mt-1">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-[#1E293B] rounded-xl p-6 text-center">
              <p className="text-[#9CA3AF]">No recent activity</p>
            </div>
          )}
        </div>
      </section>

      {/* Menu Items */}
      {isOwnProfile && (
        <section className="space-y-3 pb-24">
          <Link href="/settings" className="bg-[#1E293B] rounded-xl p-4 flex items-center gap-4 hover:bg-[#27272A] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#27272A] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="flex-1 text-white font-medium">Edit Profile</span>
            <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/circles" className="bg-[#1E293B] rounded-xl p-4 flex items-center gap-4 hover:bg-[#27272A] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#27272A] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="flex-1 text-white font-medium">Manage Circles</span>
            <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/notifications" className="bg-[#1E293B] rounded-xl p-4 flex items-center gap-4 hover:bg-[#27272A] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#27272A] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <span className="flex-1 text-white font-medium">Notification Settings</span>
            <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>
      )}
    </div>
  )
}

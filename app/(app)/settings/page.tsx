import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/app/components/BackButton'
import { getAvatarBySlug } from '@/lib/avatars'

function formatMemberSince(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function Settings() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get reading stats
  // Books shared (owned books that have been borrowed)
  const { count: sharedCount } = await supabase
    .from('borrow_history')
    .select('*', { count: 'exact', head: true })
    .eq('book_id', supabase.from('books').select('id').eq('owner_id', user.id))

  // Actually let's do this properly with multiple queries
  const { data: ownedBooks } = await supabase
    .from('books')
    .select('id')
    .eq('owner_id', user.id)

  const ownedBookIds = ownedBooks?.map(b => b.id) || []
  
  let sharedBooksCount = 0
  if (ownedBookIds.length > 0) {
    const { count } = await supabase
      .from('borrow_history')
      .select('*', { count: 'exact', head: true })
      .in('book_id', ownedBookIds)
    sharedBooksCount = count || 0
  }

  // Books borrowed by user
  const { count: borrowedCount } = await supabase
    .from('borrow_history')
    .select('*', { count: 'exact', head: true })
    .eq('borrower_id', user.id)

  // Total books read (returned)
  const { count: totalReadCount } = await supabase
    .from('user_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('event_type', 'book_returned')

  // Get user badges
  const { data: badges } = await supabase
    .from('user_badges')
    .select('*, badge:badge_id(*)')
    .eq('user_id', user.id)
    .order('awarded_at', { ascending: false })
    .limit(3)

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from('user_events')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(5)

  const avatar = getAvatarBySlug(profile?.avatar_slug)
  const memberSince = formatMemberSince(user.created_at)

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-6 pb-32">
      {/* Header */}
      <div className="mb-6">
        <BackButton fallbackHref="/circles" />
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div 
            className="w-32 h-32 rounded-full overflow-hidden"
            style={{ boxShadow: '0 0 0 3px #55B2DE' }}
            dangerouslySetInnerHTML={{ __html: avatar.svg }}
          />
          <Link
            href="/settings/profile"
            className="absolute bottom-1 right-1 w-10 h-10 bg-[#55B2DE] rounded-full flex items-center justify-center shadow-lg"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">
          {profile?.full_name || 'User'}
        </h1>
        
        {profile?.bio && (
          <p className="text-white/60 text-center italic mb-3 max-w-xs">
            "{profile.bio}"
          </p>
        )}

        <span className="px-4 py-1.5 bg-[#1E293B] text-white/80 text-sm rounded-full">
          Member since {memberSince}
        </span>
      </div>

      {/* Reading Stats */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Reading Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{sharedBooksCount}</p>
            <p className="text-xs text-white/50 uppercase tracking-wider">Shared</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{borrowedCount || 0}</p>
            <p className="text-xs text-white/50 uppercase tracking-wider">Borrowed</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{totalReadCount || 0}</p>
            <p className="text-xs text-white/50 uppercase tracking-wider">Total Read</p>
          </div>
        </div>
      </section>

      {/* Badges */}
      {badges && badges.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Badges</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {badges.map((userBadge: any) => (
              <div 
                key={userBadge.id}
                className="flex-shrink-0 bg-[#1E293B] rounded-xl px-4 py-3 min-w-[140px]"
              >
                <p className="text-white font-medium text-sm">
                  {userBadge.badge?.name || 'Badge'}
                </p>
                <p className="text-white/50 text-xs">
                  {userBadge.badge?.description || ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity: any) => (
              <div 
                key={activity.id}
                className="bg-[#1E293B] rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-[#27272A] rounded-full flex items-center justify-center">
                  {activity.event_type === 'book_borrowed' && '📖'}
                  {activity.event_type === 'book_returned' && '↩️'}
                  {activity.event_type === 'borrow_confirmed' && '✅'}
                  {!['book_borrowed', 'book_returned', 'borrow_confirmed'].includes(activity.event_type) && '📚'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">
                    {activity.event_type === 'book_returned' && (
                      <>You returned <span className="text-[#55B2DE]">"{activity.metadata?.title || 'a book'}"</span></>
                    )}
                    {activity.event_type === 'book_borrowed' && (
                      <>You borrowed <span className="text-[#55B2DE]">"{activity.metadata?.title || 'a book'}"</span></>
                    )}
                    {activity.event_type === 'borrow_confirmed' && (
                      <>Borrow confirmed for <span className="text-[#55B2DE]">"{activity.metadata?.title || 'a book'}"</span></>
                    )}
                    {!['book_borrowed', 'book_returned', 'borrow_confirmed'].includes(activity.event_type) && (
                      <>{activity.event_type.replace(/_/g, ' ')}</>
                    )}
                  </p>
                  <p className="text-white/40 text-xs">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu Options */}
      <section className="space-y-3">
        <Link 
          href="/settings/profile"
          className="flex items-center gap-4 bg-[#1E293B] rounded-xl p-4 hover:bg-[#27272A] transition-colors"
        >
          <div className="w-10 h-10 bg-[#27272A] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="flex-1 text-white font-medium">Edit Profile</span>
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link 
          href="/settings/circles"
          className="flex items-center gap-4 bg-[#1E293B] rounded-xl p-4 hover:bg-[#27272A] transition-colors"
        >
          <div className="w-10 h-10 bg-[#27272A] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="flex-1 text-white font-medium">Manage Circles</span>
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link 
          href="/settings/notifications"
          className="flex items-center gap-4 bg-[#1E293B] rounded-xl p-4 hover:bg-[#27272A] transition-colors"
        >
          <div className="w-10 h-10 bg-[#27272A] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <span className="flex-1 text-white font-medium">Notification Settings</span>
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link 
          href="/library/import"
          className="flex items-center gap-4 bg-[#1E293B] rounded-xl p-4 hover:bg-[#27272A] transition-colors"
        >
          <div className="w-10 h-10 bg-[#27272A] rounded-full flex items-center justify-center">
            <span className="text-xl">📚</span>
          </div>
          <span className="flex-1 text-white font-medium">Goodreads Import</span>
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link 
          href="/settings/account"
          className="flex items-center gap-4 bg-[#1E293B] rounded-xl p-4 hover:bg-[#27272A] transition-colors"
        >
          <div className="w-10 h-10 bg-[#27272A] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#55B2DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="flex-1 text-white font-medium">Account Settings</span>
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    </div>
  )
}

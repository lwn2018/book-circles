import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PendingCircleJoinHandler from './PendingCircleJoinHandler'
import FounderBanner from '../../components/FounderBanner'
import Avatar from '@/app/components/Avatar'

// Stacked avatars component for circle cards
function StackedAvatars({ members, maxDisplay = 3 }: { members: any[], maxDisplay?: number }) {
  const displayMembers = members.slice(0, maxDisplay)
  const remaining = members.length - maxDisplay

  return (
    <div className="flex items-center">
      {displayMembers.map((member, index) => (
        <div 
          key={member.profiles?.id || index}
          className={`${index > 0 ? '-ml-2' : ''}`}
          title={member.profiles?.full_name || 'Member'}
        >
          <Avatar
            avatarSlug={member.profiles?.avatar_slug}
            userName={member.profiles?.full_name || 'Member'}
            userId={member.profiles?.id || ''}
            size="xs"
            className="border-2 border-[#1E293B]"
          />
        </div>
      ))}
      {remaining > 0 && (
        <div 
          className="-ml-2 w-6 h-6 rounded-full bg-[#27272A] flex items-center justify-center text-[#94A3B8] text-[10px] font-medium border-2 border-[#1E293B]"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}

// Circle card component
function CircleCard({ 
  circle, 
  memberCount, 
  newBooksCount,
  members 
}: { 
  circle: any
  memberCount: number
  newBooksCount: number
  members: any[]
}) {
  return (
    <Link
      href={`/circles/${circle.id}`}
      className="block bg-[#1E293B] rounded-xl p-4 hover:bg-[#27272A] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Circle name with New badge */}
          <div className="flex items-center gap-2 mb-1">
            <h2 
              className="text-white font-semibold truncate"
              style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600 }}
            >
              {circle.name}
            </h2>
            {newBooksCount > 0 && (
              <span 
                className="bg-[#55B2DE] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {newBooksCount} New
              </span>
            )}
          </div>
          
          {/* Description */}
          {circle.description && (
            <p 
              className="text-[#9F9FA9] text-sm line-clamp-2 mb-3"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {circle.description}
            </p>
          )}
          
          {/* Bottom row: avatars + stats */}
          <div className="flex items-center gap-4">
            <StackedAvatars members={members} maxDisplay={3} />
            <span 
              className="text-[#9F9FA9] text-xs"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
            </span>
          </div>
        </div>
        
        {/* Arrow */}
        <div className="text-[#64748B] mt-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    </Link>
  )
}

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

  // Get user's circles with member info
  const { data: memberships } = await supabase
    .from('circle_members')
    .select(`
      *,
      circles (
        id,
        name,
        description,
        invite_code,
        owner_id,
        created_at
      )
    `)
    .eq('user_id', user.id)

  const circles = memberships?.map(m => m.circles).filter(Boolean) || []

  // Get all members for each circle for avatar display
  const circleIds = circles.map(c => c.id)
  
  const { data: allMembers } = circleIds.length > 0 
    ? await supabase
        .from('circle_members')
        .select(`
          circle_id,
          user_id,
          profiles (id, full_name, avatar_slug)
        `)
        .in('circle_id', circleIds)
    : { data: [] }

  // Group members by circle
  const membersByCircle: Record<string, any[]> = {}
  const memberCountByCircle: Record<string, number> = {}
  
  allMembers?.forEach(member => {
    if (!membersByCircle[member.circle_id]) {
      membersByCircle[member.circle_id] = []
      memberCountByCircle[member.circle_id] = 0
    }
    membersByCircle[member.circle_id].push(member)
    memberCountByCircle[member.circle_id]++
  })

  // Get all member user IDs for fetching books
  const allMemberUserIds = [...new Set(allMembers?.map(m => m.user_id) || [])]

  // Get books count per circle (available books = status 'available')
  // We need to get books owned by circle members and count available ones
  const { data: allBooks } = allMemberUserIds.length > 0
    ? await supabase
        .from('books')
        .select('id, owner_id, status, created_at')
        .in('owner_id', allMemberUserIds)
    : { data: [] }

  // Get hidden books per circle
  const { data: hiddenVisibility } = circleIds.length > 0
    ? await supabase
        .from('book_circle_visibility')
        .select('book_id, circle_id')
        .in('circle_id', circleIds)
        .eq('is_visible', false)
    : { data: [] }

  // Create set of hidden book IDs per circle
  const hiddenBooksByCircle: Record<string, Set<string>> = {}
  hiddenVisibility?.forEach(h => {
    if (!hiddenBooksByCircle[h.circle_id]) {
      hiddenBooksByCircle[h.circle_id] = new Set()
    }
    hiddenBooksByCircle[h.circle_id].add(h.book_id)
  })

  // Calculate available books per circle
  const newBooksByCircle: Record<string, number> = {}
  
  // TODO: For "new" books, we'd ideally track user's last_visited_at per circle
  // For now, count books created in the last 7 days as "new"
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  circles.forEach(circle => {
    const circleMembers = membersByCircle[circle.id] || []
    const circleMemberIds = new Set(circleMembers.map(m => m.user_id))
    const hiddenBooks = hiddenBooksByCircle[circle.id] || new Set()
    
    // Filter books that belong to circle members and are not hidden
    const circleBooks = allBooks?.filter(book => 
      circleMemberIds.has(book.owner_id) && !hiddenBooks.has(book.id)
    ) || []
    
    
    // Count "new" books (created in last 7 days)
    newBooksByCircle[circle.id] = circleBooks.filter(b => 
      new Date(b.created_at) > sevenDaysAgo
    ).length
  })


  // Get count of books offered to user
  const { count: offersCount } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
    .eq('next_recipient', user.id)
    .eq('status', 'ready_for_next')

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Handle pending circle join from signup flow */}
      <PendingCircleJoinHandler />
      
      {/* Founder tester banner (dismissible) */}
      <FounderBanner userId={user.id} />
      
      <div className="px-4 py-6 pb-24">
        {/* Header Section */}
        <div className="mb-6">
          <h1 
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}
          >
            Your Circles
          </h1>
          <p 
            className="text-[#9F9FA9] mt-1"
            style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}
          >
            Your trusted book lending communities
          </p>
        </div>


        {/* Books Offered Counter (if any) */}
        {offersCount !== null && offersCount > 0 && (
          <Link
            href="/dashboard/offers"
            className="block mb-6 bg-[#1E3A2F] border border-[#22543D] rounded-xl p-4 hover:bg-[#234338] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#22543D] rounded-lg flex items-center justify-center">
                  <span className="text-xl">📬</span>
                </div>
                <div>
                  <h3 
                    className="font-semibold text-[#86EFAC]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Books Offered to You
                  </h3>
                  <p className="text-sm text-[#6EE7A0]">
                    {offersCount} book{offersCount !== 1 ? 's' : ''} waiting!
                  </p>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </Link>
        )}

        {/* Admin Dashboard Link */}
        {profile?.is_admin && (
          <Link
            href="/admin"
            className="block mb-6 bg-[#2D1B4E] border border-[#4C2889] rounded-xl p-4 hover:bg-[#3D2563] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#4C2889] rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <span className="text-[#C4B5FD] font-medium">Admin Dashboard</span>
            </div>
          </Link>
        )}

        {/* Circles List */}
        {circles.length === 0 ? (
          <div className="text-center py-12 bg-[#1E293B] rounded-xl">
            <div className="w-16 h-16 bg-[#27272A] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <p 
              className="text-white font-medium mb-2"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              You're not in any circles yet
            </p>
            <p 
              className="text-sm text-[#9F9FA9] px-6"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              A circle is a group of friends who share books. Create one and invite your people — or join one you've been invited to.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-24">
            {circles.map((circle: any) => (
              <CircleCard
                key={circle.id}
                circle={circle}
                memberCount={memberCountByCircle[circle.id] || 0}
                newBooksCount={newBooksByCircle[circle.id] || 0}
                members={membersByCircle[circle.id] || []}
              />
            ))}
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="fixed left-0 right-0 px-4 pb-4 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent pt-8" style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
          <div className="flex gap-3 max-w-lg mx-auto">
            <Link
              href="/circles/create"
              className="flex-1 bg-[#55B2DE] text-white font-semibold py-3 px-4 rounded-xl text-center hover:bg-[#4A9FCB] transition-colors"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              + Create Circle
            </Link>
            <Link
              href="/circles/join"
              className="flex-1 bg-transparent border-2 border-[#55B2DE] text-[#55B2DE] font-semibold py-3 px-4 rounded-xl text-center hover:bg-[#55B2DE]/10 transition-colors"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Join Circle
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

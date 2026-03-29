import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Avatar from '@/app/components/Avatar'
import BooksListWithFilters from './BooksListWithFilters'
import InviteLink from './InviteLink'
import RecentlyAddedCarousel from './RecentlyAddedCarousel'

export const revalidate = 0

// StackedAvatars component for member display
function StackedAvatars({ members, maxDisplay = 5 }: { members: any[], maxDisplay?: number }) {
  const displayMembers = members.slice(0, maxDisplay)
  const remaining = members.length - maxDisplay

  return (
    <div className="flex items-center">
      {displayMembers.map((member, index) => (
        <div 
          key={member.profiles?.id || index}
          className={`${index > 0 ? '-ml-3' : ''}`}
          title={member.profiles?.full_name || 'Member'}
        >
          <Avatar
            avatarSlug={member.profiles?.avatar_slug}
            userName={member.profiles?.full_name || 'Member'}
            userId={member.profiles?.id || ''}
            size="sm"
            className="border-2 border-[#121212]"
          />
        </div>
      ))}
      {remaining > 0 && (
        <div 
          className="-ml-3 w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center text-[#94A3B8] text-sm font-medium border-2 border-[#121212]"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}

export default async function CirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_browse_view')
    .eq('id', user.id)
    .single()

  const { data: circle } = await supabase
    .from('circles')
    .select('*')
    .eq('id', id)
    .single()

  if (!circle) redirect('/dashboard')

  const { data: membership } = await supabase
    .from('circle_members')
    .select('*')
    .eq('circle_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  // Get blocked user IDs (both directions)
  const { data: blocksIInitiated } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', user.id)
  
  const { data: blocksAgainstMe } = await supabase
    .from('blocked_users')
    .select('blocker_id')
    .eq('blocked_id', user.id)

  const blockedUserIds = new Set<string>()
  blocksIInitiated?.forEach(b => blockedUserIds.add(b.blocked_id))
  blocksAgainstMe?.forEach(b => blockedUserIds.add(b.blocker_id))

  const { data: members } = await supabase
    .from('circle_members')
    .select(`*, profiles (id, full_name, email, avatar_slug)`)
    .eq('circle_id', id)

  // Filter out blocked members from display
  const visibleMembers = members?.filter(m => !blockedUserIds.has(m.user_id)) || []

  const { data: memberIds } = await supabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', id)
  
  // Filter owner IDs to exclude blocked users when fetching books
  const allOwnerIds = memberIds?.map(m => m.user_id) || []
  const visibleOwnerIds = allOwnerIds.filter(id => !blockedUserIds.has(id))

  const { data: allBooks } = await supabase
    .from('books')
    .select(`
      id, title, author, isbn, cover_url, status, gift_on_borrow,
      owner_id, current_borrower_id, due_date, created_at,
      owner:owner_id (full_name),
      current_borrower:current_borrower_id (full_name),
      book_queue (id, user_id, position, pass_count, last_pass_reason, profiles (full_name))
    `)
    .in('owner_id', visibleOwnerIds.length > 0 ? visibleOwnerIds : ['__none__'])
    .order('created_at', { ascending: false })

  const { data: hiddenBooks } = await supabase
    .from('book_circle_visibility')
    .select('book_id')
    .eq('circle_id', id)
    .eq('is_visible', false)

  const hiddenBookIds = new Set(hiddenBooks?.map(h => h.book_id) || [])
  const visibleBooks = allBooks?.filter(book => !hiddenBookIds.has(book.id)) || []

  // Deduplicate books by ISBN or title+author
  const seenBooks = new Map<string, any>()
  const books = visibleBooks.filter(book => {
    const key = book.isbn 
      ? `isbn:${book.isbn}`
      : `title:${book.title.toLowerCase()}:author:${(book.author || '').toLowerCase()}`
    if (seenBooks.has(key)) return false
    seenBooks.set(key, book)
    return true
  })

  // Stats (use visible members count)
  const memberCount = visibleMembers.length
  const sharedCount = books.length
  const activeCount = books.filter(b => b.status === 'borrowed').length

  // Recently added books (last 10, sorted by created_at)
  const recentlyAdded = [...books].map(book => ({
    ...book,
    owner: Array.isArray(book.owner) ? book.owner[0] : book.owner,
    current_borrower: Array.isArray(book.current_borrower) ? book.current_borrower[0] : book.current_borrower
  }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  // Format founded date
  const foundedDate = new Date(circle.created_at).toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  })

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="px-4 py-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-2">
          {/* Back arrow + Title */}
          <div className="flex items-center gap-3">
            <Link 
              href="/circles" 
              className="text-[#94A3B8] hover:text-white transition-colors p-1 -ml-1"
              aria-label="Back to circles"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <h1 
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}
            >
              {circle.name}
            </h1>
          </div>
          
          {/* Invite Button */}
          <InviteLink inviteCode={circle.invite_code} circleName={circle.name} variant="pill" />
        </div>

        {/* Subtitle */}
        <p 
          className="text-[#9F9FA9] ml-9 mb-4"
          style={{ fontFamily: 'var(--font-figtree)', fontSize: '14px', fontWeight: 400 }}
        >
          Founded {foundedDate} • {circle.is_private ? 'Private' : 'Public'} Circle
        </p>

        {/* Members Row */}
        <div className="flex items-center gap-3 ml-9 mb-6">
          <StackedAvatars members={visibleMembers} maxDisplay={5} />
          <span 
            className="text-[#9F9FA9] text-sm"
            style={{ fontFamily: 'var(--font-figtree)' }}
          >
            {memberCount} Active Member{memberCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1E293B] rounded-xl p-4 text-center border border-[#334155]">
            <p 
              className="text-[#9F9FA9] uppercase tracking-wider mb-1"
              style={{ fontFamily: 'var(--font-figtree)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.05em' }}
            >
              Members
            </p>
            <p 
              className="text-[#55B2DE]"
              style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}
            >
              {memberCount}
            </p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4 text-center border border-[#334155]">
            <p 
              className="text-[#9F9FA9] uppercase tracking-wider mb-1"
              style={{ fontFamily: 'var(--font-figtree)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.05em' }}
            >
              Shared
            </p>
            <p 
              className="text-[#55B2DE]"
              style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}
            >
              {sharedCount}
            </p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4 text-center border border-[#334155]">
            <p 
              className="text-[#9F9FA9] uppercase tracking-wider mb-1"
              style={{ fontFamily: 'var(--font-figtree)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.05em' }}
            >
              Active
            </p>
            <p 
              className="text-[#55B2DE]"
              style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}
            >
              {activeCount}
            </p>
          </div>
        </div>

        {/* Recently Added Section */}
        {recentlyAdded.length > 0 && (
          <RecentlyAddedCarousel 
            books={recentlyAdded as any} 
            userId={user.id}
            circleId={id}
          />
        )}

        {/* Books Section with Filters */}
        <BooksListWithFilters 
          books={(books as any) || []} 
          userId={user.id} 
          circleId={id}
          circleMemberIds={visibleOwnerIds}
          defaultBrowseView={profile?.default_browse_view || 'card'}
        />
      </div>
    </div>
  )
}

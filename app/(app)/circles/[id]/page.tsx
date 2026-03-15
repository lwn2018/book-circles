import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Avatar from '@/app/components/Avatar'
import BooksListWithFilters from './BooksListWithFilters'
import InviteLink from './InviteLink'

export const revalidate = 0

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

  const { data: members } = await supabase
    .from('circle_members')
    .select(`*, profiles (id, full_name, email, avatar_slug)`)
    .eq('circle_id', id)

  const { data: memberIds } = await supabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', id)
  
  const ownerIds = memberIds?.map(m => m.user_id) || []

  const { data: allBooks } = await supabase
    .from('books')
    .select(`
      id, title, author, isbn, cover_url, status, gift_on_borrow,
      owner_id, current_borrower_id, due_date, created_at,
      owner:owner_id (full_name),
      current_borrower:current_borrower_id (full_name),
      book_queue (id, user_id, position, pass_count, last_pass_reason, profiles (full_name))
    `)
    .in('owner_id', ownerIds)
    .order('created_at', { ascending: false })

  const { data: hiddenBooks } = await supabase
    .from('book_circle_visibility')
    .select('book_id')
    .eq('circle_id', id)
    .eq('is_visible', false)

  const hiddenBookIds = new Set(hiddenBooks?.map(h => h.book_id) || [])
  const visibleBooks = allBooks?.filter(book => !hiddenBookIds.has(book.id)) || []

  const seenBooks = new Map<string, any>()
  const books = visibleBooks.filter(book => {
    const key = book.isbn 
      ? `isbn:${book.isbn}`
      : `title:${book.title.toLowerCase()}:author:${(book.author || '').toLowerCase()}`
    if (seenBooks.has(key)) return false
    seenBooks.set(key, book)
    return true
  })

  const memberCount = members?.length || 0
  const sharedCount = books.length
  const activeCount = books.filter(b => b.status === 'borrowed').length

  const foundedDate = new Date(circle.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="px-4 py-6">
        {/* Circle Name - Montreal 24px bold */}
        <h1 
          className="text-2xl font-bold text-white"
          style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}
        >
          {circle.name}
        </h1>
        
        {/* Subtitle - Figtree 14px regular */}
        <p 
          className="text-[#9F9FA9] mt-1"
          style={{ fontFamily: 'var(--font-figtree)', fontSize: '14px', fontWeight: 400 }}
        >
          Founded {foundedDate} • {circle.is_private ? 'Private' : 'Public'} Circle
        </p>

        {/* Members Row */}
        <div className="flex items-center gap-4 mt-6 mb-6">
          <div className="flex items-center">
            {members?.slice(0, 5).map((member: any, index: number) => (
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
            {memberCount > 5 && (
              <div 
                className="-ml-3 w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center text-[#94A3B8] text-sm font-medium border-2 border-[#121212]"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                +{memberCount - 5}
              </div>
            )}
          </div>
          <InviteLink inviteCode={circle.invite_code} variant="pill" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            {/* Label - Figtree 10px regular */}
            <p 
              className="text-[#9F9FA9] uppercase tracking-wide mb-1"
              style={{ fontFamily: 'var(--font-figtree)', fontSize: '10px', fontWeight: 400 }}
            >
              Members
            </p>
            {/* Number - Montreal 24px bold */}
            <p 
              className="text-[#55B2DE]"
              style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}
            >
              {memberCount}
            </p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            <p 
              className="text-[#9F9FA9] uppercase tracking-wide mb-1"
              style={{ fontFamily: 'var(--font-figtree)', fontSize: '10px', fontWeight: 400 }}
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
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            <p 
              className="text-[#9F9FA9] uppercase tracking-wide mb-1"
              style={{ fontFamily: 'var(--font-figtree)', fontSize: '10px', fontWeight: 400 }}
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

        {/* Books Section */}
        <BooksListWithFilters 
          books={(books as any) || []} 
          userId={user.id} 
          circleId={id}
          circleMemberIds={ownerIds}
          defaultBrowseView={profile?.default_browse_view || 'card'}
        />
      </div>
    </div>
  )
}

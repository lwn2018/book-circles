import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BooksListWithFilters from './BooksListWithFilters'
import InviteLink from './InviteLink'
import CollapsibleMembersList from './CollapsibleMembersList'

// Disable caching for this page - always fetch fresh data
export const revalidate = 0

export default async function CirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user profile for preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('default_browse_view')
    .eq('id', user.id)
    .single()

  // Get circle details
  const { data: circle } = await supabase
    .from('circles')
    .select('*')
    .eq('id', id)
    .single()

  if (!circle) {
    redirect('/dashboard')
  }

  // Verify membership
  const { data: membership } = await supabase
    .from('circle_members')
    .select('*')
    .eq('circle_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  // Get all members
  const { data: members } = await supabase
    .from('circle_members')
    .select(`
      *,
      profiles (
        id,
        full_name,
        email
      )
    `)
    .eq('circle_id', id)

  // Get all books owned by circle members
  // Books are visible by default unless explicitly hidden in book_circle_visibility
  const { data: memberIds } = await supabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', id)
  
  const ownerIds = memberIds?.map(m => m.user_id) || []

  const { data: allBooks } = await supabase
    .from('books')
    .select(`
      id,
      title,
      author,
      isbn,
      cover_url,
      status,
      gift_on_borrow,
      owner_id,
      current_borrower_id,
      due_date,
      created_at,
      owner:owner_id (
        full_name
      ),
      current_borrower:current_borrower_id (
        full_name
      ),
      book_queue (
        id,
        user_id,
        position,
        pass_count,
        last_pass_reason,
        profiles (
          full_name
        )
      )
    `)
    .in('owner_id', ownerIds)
    .order('created_at', { ascending: false })

  // Get hidden books for this circle (opt-out model)
  const { data: hiddenBooks } = await supabase
    .from('book_circle_visibility')
    .select('book_id')
    .eq('circle_id', id)
    .eq('is_visible', false)

  const hiddenBookIds = new Set(hiddenBooks?.map(h => h.book_id) || [])

  // Filter out hidden books
  const visibleBooks = allBooks?.filter(book => !hiddenBookIds.has(book.id)) || []

  // De-duplicate books (by ISBN if available, otherwise by title+author)
  const seenBooks = new Map<string, any>()
  const books = visibleBooks.filter(book => {
    const key = book.isbn 
      ? `isbn:${book.isbn}`
      : `title:${book.title.toLowerCase()}:author:${(book.author || '').toLowerCase()}`
    
    if (seenBooks.has(key)) {
      // Skip duplicate - keep the first occurrence
      return false
    }
    
    seenBooks.set(key, book)
    return true
  })

  // Calculate stats
  const memberCount = members?.length || 0
  const sharedCount = books.length
  const activeCount = books.filter(b => b.status === 'borrowed').length

  // Format founded date
  const foundedDate = new Date(circle.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#121212] p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-[Montreal]">{circle.name}</h1>
          <p className="text-gray-400 text-sm mt-1 font-[Figtree]">
            Founded {foundedDate} • {circle.is_private ? 'Private' : 'Public'} Circle
          </p>
        </div>

        {/* Members Row with Overlapping Avatars */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center">
            {members?.slice(0, 5).map((member: any, index: number) => (
              <div 
                key={member.profiles?.id || index}
                className={`w-10 h-10 rounded-full bg-[#334155] flex items-center justify-center text-white font-medium border-2 border-[#121212] ${index > 0 ? '-ml-3' : ''}`}
                title={member.profiles?.full_name || 'Member'}
              >
                {(member.profiles?.full_name || 'M').charAt(0).toUpperCase()}
              </div>
            ))}
            {memberCount > 5 && (
              <div className="-ml-3 w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center text-[#94A3B8] text-sm font-medium border-2 border-[#121212]">
                +{memberCount - 5}
              </div>
            )}
          </div>
          <InviteLink inviteCode={circle.invite_code} variant="pill" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide mb-1 font-[Figtree]">Members</p>
            <p className="text-[#55B2DE] text-2xl font-bold font-[Montreal]">{memberCount}</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide mb-1 font-[Figtree]">Shared</p>
            <p className="text-[#55B2DE] text-2xl font-bold font-[Montreal]">{sharedCount}</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4 text-center">
            <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide mb-1 font-[Figtree]">Active</p>
            <p className="text-[#55B2DE] text-2xl font-bold font-[Montreal]">{activeCount}</p>
          </div>
        </div>

        {/* Books Section */}
        <div>
          <BooksListWithFilters 
            books={(books as any) || []} 
            userId={user.id} 
            circleId={id}
            circleMemberIds={ownerIds}
            defaultBrowseView={profile?.default_browse_view || 'card'}
          />
        </div>
      </div>
    </div>
  )
}

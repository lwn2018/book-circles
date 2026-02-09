import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BooksListWithFilters from './BooksListWithFilters'
import InviteLink from './InviteLink'
import LeaveCircleButton from './LeaveCircleButton'

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
  const books = allBooks?.filter(book => !hiddenBookIds.has(book.id)) || []

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block text-sm sm:text-base">
          ← Back to Dashboard
        </Link>

        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold">{circle.name}</h1>
            <LeaveCircleButton 
              circleId={id}
              circleName={circle.name}
              userId={user.id}
              isOwner={circle.owner_id === user.id}
            />
          </div>
          {circle.description && (
            <p className="text-gray-600 mb-2 text-sm sm:text-base">{circle.description}</p>
          )}
          <InviteLink inviteCode={circle.invite_code} />
          <p className="text-sm text-gray-500 mt-1">
            {members?.length || 0} member{members?.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Books</h2>
            <BooksListWithFilters 
              books={(books as any) || []} 
              userId={user.id} 
              circleId={id}
              circleMemberIds={ownerIds}
              defaultBrowseView={profile?.default_browse_view || 'card'}
            />
          </div>

          <div className="order-1 lg:order-2">
            <div className="mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-semibold mb-3">Members</h3>
              <div className="space-y-2">
                {members?.map((member: any) => (
                  <div key={member.id} className="text-sm">
                    <p className="font-medium">{member.profiles.full_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

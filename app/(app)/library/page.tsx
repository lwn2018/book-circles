import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LibraryWithViewToggle from './LibraryWithViewToggle'

export default async function MyLibraryTab() {
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

  // Get all books owned by this user
  const { data: books } = await supabase
    .from('books')
    .select(`
      *,
      current_holder:current_borrower_id (
        id,
        full_name
      )
    `)
    .eq('owner_id', user.id)
    .order('title', { ascending: true })

  // Get user's circles for visibility toggles
  const { data: userCircles } = await supabase
    .from('circle_members')
    .select('circle_id, circles(id, name)')
    .eq('user_id', user.id)

  const circles = userCircles?.map(m => m.circles) || []

  // For each book, get visibility settings
  const booksWithVisibility = await Promise.all(
    (books || []).map(async (book) => {
      const { data: visibility } = await supabase
        .from('book_circle_visibility')
        .select('circle_id, is_visible')
        .eq('book_id', book.id)

      return {
        ...book,
        visibility: visibility || []
      }
    })
  )

  // Categorize books by status
  const onShelf = booksWithVisibility.filter(b => b.status === 'available')
  const offShelf = booksWithVisibility.filter(b => b.status === 'off_shelf')
  const lentOut = booksWithVisibility.filter(b => b.status === 'borrowed')
  const inTransit = booksWithVisibility.filter(b => b.status === 'ready_for_next' || b.status === 'in_transit')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Library</h1>
        <p className="text-gray-600 mt-1">
          All your books • {booksWithVisibility.length} total
        </p>
      </div>

      {/* Import from Goodreads */}
      <div className="mb-6">
        <Link
          href="/library/import"
          className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          📥 Import from Goodreads
        </Link>
      </div>

      {booksWithVisibility.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">You haven't added any books yet.</p>
          <p className="text-sm text-gray-500">
            Use the "+ Add Book" button above to get started.
          </p>
        </div>
      ) : (
        <LibraryWithViewToggle
          onShelf={onShelf as any}
          offShelf={offShelf as any}
          lentOut={lentOut as any}
          inTransit={inTransit as any}
          circles={circles as any}
          userId={user.id}
          defaultBrowseView={profile?.default_browse_view || 'card'}
        />
      )}
    </div>
  )
}

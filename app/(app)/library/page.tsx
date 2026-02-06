import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LibraryBookCard from '@/app/library/LibraryBookCard'

export default async function MyLibraryTab() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

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
  const lentOut = booksWithVisibility.filter(b => b.status === 'borrowed')
  const inTransit = booksWithVisibility.filter(b => b.status === 'ready_for_next')

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
        <div className="space-y-8">
          {/* On My Shelf */}
          {onShelf.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">📚 On My Shelf ({onShelf.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onShelf.map((book) => (
                  <LibraryBookCard
                    key={book.id}
                    book={book as any}
                    userCircles={circles as any}
                    userId={user.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Lent Out */}
          {lentOut.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">📖 Lent Out ({lentOut.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lentOut.map((book) => (
                  <LibraryBookCard
                    key={book.id}
                    book={book as any}
                    userCircles={circles as any}
                    userId={user.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* In Transit */}
          {inTransit.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">🚚 In Transit ({inTransit.length})</h2>
              <p className="text-sm text-gray-600 mb-4">
                Books ready for the next person to pick up
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inTransit.map((book) => (
                  <LibraryBookCard
                    key={book.id}
                    book={book as any}
                    userCircles={circles as any}
                    userId={user.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

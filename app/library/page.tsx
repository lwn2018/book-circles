import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LibraryBookCard from './LibraryBookCard'
import AddBookButton from './AddBookButton'

export default async function MyLibrary() {
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

  // Get user's circles
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

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Library</h1>
            <p className="text-gray-600 mt-1">
              All your books • {booksWithVisibility.length} total
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/library/import"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              📥 Import from Goodreads
            </Link>
            <AddBookButton userId={user.id} userCircles={circles as any} />
          </div>
        </div>

        {booksWithVisibility.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">You haven't added any books yet.</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Go to circles to add books
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {booksWithVisibility.map((book) => (
              <LibraryBookCard 
                key={book.id} 
                book={book as any}
                userCircles={circles as any}
                userId={user.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

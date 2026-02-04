import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OwnedBookCard from './OwnedBookCard'

export default async function MyOwnedBooks() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get books owned by this user that are currently borrowed
  const { data: ownedBooks } = await supabase
    .from('books')
    .select(`
      *,
      current_holder:current_borrower_id (
        id,
        full_name
      ),
      circle:circle_id (
        id,
        name
      )
    `)
    .eq('owner_id', user.id)
    .eq('status', 'borrowed')
    .order('borrowed_at', { ascending: false })

  // For each book, get queue info
  const booksWithQueue = await Promise.all(
    (ownedBooks || []).map(async (book) => {
      const { data: queue } = await supabase
        .from('book_queue')
        .select(`
          *,
          profiles (
            id,
            full_name
          )
        `)
        .eq('book_id', book.id)
        .order('position', { ascending: true })
        .limit(3)

      return { ...book, queue: queue || [] }
    })
  )

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">My Books (Currently Borrowed)</h1>
        <p className="text-gray-600 mb-6">
          Books you own that are currently being borrowed by others.
        </p>

        {booksWithQueue.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">None of your books are currently borrowed.</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
              Go to circles
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {booksWithQueue.map((book) => (
              <OwnedBookCard key={book.id} book={book as any} userId={user.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

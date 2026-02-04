import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BorrowedBookCard from './BorrowedBookCard'

export default async function MyBorrowedBooks() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get books currently borrowed by this user
  const { data: borrowedBooks } = await supabase
    .from('books')
    .select(`
      *,
      owner:owner_id (
        id,
        full_name
      ),
      circle:circle_id (
        id,
        name
      )
    `)
    .eq('current_borrower_id', user.id)
    .order('due_date', { ascending: true })

  // For each book, get queue info
  const booksWithQueue = await Promise.all(
    (borrowedBooks || []).map(async (book) => {
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

        <h1 className="text-3xl font-bold mb-6">My Borrowed Books</h1>

        {booksWithQueue.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You're not currently borrowing any books.</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
              Browse circles
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {booksWithQueue.map((book) => (
              <BorrowedBookCard key={book.id} book={book as any} userId={user.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

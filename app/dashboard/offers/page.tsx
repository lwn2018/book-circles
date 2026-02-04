import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BookOfferCard from '../components/BookOfferCard'

export default async function BookOffers() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get books where user is the next recipient
  const { data: offeredBooks } = await supabase
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
    .eq('next_recipient', user.id)
    .eq('status', 'ready_for_next')

  // Get queue info for each offered book
  const booksWithQueueInfo = await Promise.all(
    (offeredBooks || []).map(async (book) => {
      const { data: queueEntry } = await supabase
        .from('book_queue')
        .select('*')
        .eq('book_id', book.id)
        .eq('user_id', user.id)
        .single()

      return {
        ...book,
        queue_position: queueEntry?.position,
        pass_count: queueEntry?.pass_count || 0,
        queue_entry_id: queueEntry?.id
      }
    })
  )

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">Books Offered to You</h1>
        <p className="text-gray-600 mb-6">
          These books are ready for you to pick up. Accept or pass within 48 hours.
        </p>

        {booksWithQueueInfo.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No books are currently offered to you.</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
              Browse circles
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {booksWithQueueInfo.map((book) => (
              <BookOfferCard 
                key={book.id} 
                book={book as any} 
                userId={user.id}
                queueEntryId={book.queue_entry_id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

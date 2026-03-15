import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DoneReadingButton from './DoneReadingButton'
import BookCover from '@/app/components/BookCover'

export default async function MyShelfTab() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  // Get pending handoffs (incoming and outgoing)
  const { data: pendingHandoffs } = await supabase
    .from('handoff_confirmations')
    .select(`
      id,
      giver_id,
      receiver_id,
      giver_confirmed_at,
      receiver_confirmed_at,
      books:book_id (id, title, author, cover_url, isbn),
      giver:profiles!handoff_confirmations_giver_id_fkey (id, full_name, avatar_type, avatar_id),
      receiver:profiles!handoff_confirmations_receiver_id_fkey (id, full_name, avatar_type, avatar_id)
    `)
    .is('both_confirmed_at', null)
    .or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Split into incoming (user is receiver) and outgoing (user is giver)
  const incomingHandoffs = pendingHandoffs?.filter(h => h.receiver_id === user.id) || []
  const outgoingHandoffs = pendingHandoffs?.filter(h => h.giver_id === user.id) || []

  // Get books user is currently borrowing
  const { data: borrowedBooks } = await supabase
    .from('books')
    .select(`
      *,
      owner:owner_id (id, full_name, avatar_type, avatar_id, avatar_url)
    `)
    .eq('current_borrower_id', user.id)
    .eq('status', 'borrowed')
    .order('borrowed_at', { ascending: false })

  // Get queue positions
  const { data: queueEntries } = await supabase
    .from('book_queue')
    .select(`
      *,
      book:book_id (
        *,
        owner:owner_id (id, full_name, avatar_type, avatar_id, avatar_url)
      )
    `)
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  // Get books user owns that are currently lent out
  const { data: lentBooks } = await supabase
    .from('books')
    .select('id')
    .eq('owner_id', user.id)
    .eq('status', 'borrowed')

  // Get reading history (returned books)
  const { data: readingHistoryEvents } = await supabase
    .from('user_events')
    .select('id, metadata, timestamp, created_at')
    .eq('user_id', user.id)
    .eq('event_type', 'book_returned')
    .order('timestamp', { ascending: false })
    .limit(5)

  // Fetch book details for reading history
  const historyBookIds = readingHistoryEvents?.map(e => e.metadata?.book_id).filter(Boolean) || []
  const { data: historyBooks } = historyBookIds.length > 0
    ? await supabase.from('books').select('id, title, cover_url, author').in('id', historyBookIds)
    : { data: [] }
  const historyBookMap = new Map(historyBooks?.map(b => [b.id, b]) || [])
  const readingHistory = readingHistoryEvents?.map(e => ({
    ...e,
    book: historyBookMap.get(e.metadata?.book_id) || null
  })) || []

  const borrowedCount = borrowedBooks?.length || 0
  const queueCount = queueEntries?.length || 0
  const lendingCount = lentBooks?.length || 0

  const getDaysBorrowed = (borrowedAt: string | null) => {
    if (!borrowedAt) return null
    return Math.floor((Date.now() - new Date(borrowedAt).getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-6 pb-32">
      {/* Header */}
      <div className="mb-6">
        <h1 
          className="text-2xl font-bold text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          My Shelf
        </h1>
        <p className="text-[#9CA3AF] text-sm mt-1">
          Books you've borrowed and books you own.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-[#1E293B] rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {borrowedCount}
            </p>
            <p className="text-sm text-[#9CA3AF]">Currently Reading</p>
          </div>
          <div className="text-[#55B2DE]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
        <div className="bg-[#1E293B] rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {lendingCount}
            </p>
            <p className="text-sm text-[#9CA3AF]">Currently Lending</p>
          </div>
          <div className="text-[#55B2DE]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Incoming Books - User is receiver */}
      {incomingHandoffs.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-lg font-semibold text-white mb-4 flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>📥</span> Incoming Books
          </h2>
          
          <div className="space-y-3">
            {incomingHandoffs.map((handoff: any) => {
              const book = handoff.books
              const giver = handoff.giver
              if (!book) return null

              return (
                <div key={handoff.id} className="bg-[#1E293B] rounded-xl p-4 border border-emerald-500/30">
                  <div className="flex gap-4">
                    <BookCover
                      coverUrl={book.cover_url}
                      title={book.title}
                      author={book.author}
                      isbn={book.isbn}
                      className="w-20 h-28 rounded-lg shadow-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      {/* From badge */}
                      <span className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full mb-2">
                        From {giver?.full_name || 'Unknown'}
                      </span>
                      
                      <h3 className="font-semibold text-white truncate">{book.title}</h3>
                      <p className="text-sm text-[#9CA3AF] truncate">{book.author}</p>
                      
                      {/* Confirm Pickup Button */}
                      <Link 
                        href={`/handoff/${handoff.id}`}
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirm Pickup
                      </Link>
                    </div>
                    
                    {/* Chevron */}
                    <Link href={`/books/${book.id}`} className="flex items-center text-[#6B7280]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Pending Handoffs - User is giver */}
      {outgoingHandoffs.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-lg font-semibold text-white mb-4 flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>📤</span> Pending Handoffs
          </h2>
          
          <div className="space-y-3">
            {outgoingHandoffs.map((handoff: any) => {
              const book = handoff.books
              const receiver = handoff.receiver
              if (!book) return null

              return (
                <div key={handoff.id} className="bg-[#1E293B] rounded-xl p-4 border border-amber-500/30">
                  <div className="flex gap-4">
                    <BookCover
                      coverUrl={book.cover_url}
                      title={book.title}
                      author={book.author}
                      isbn={book.isbn}
                      className="w-20 h-28 rounded-lg shadow-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      {/* To badge */}
                      <span className="inline-block px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded-full mb-2">
                        To {receiver?.full_name || 'Unknown'}
                      </span>
                      
                      <h3 className="font-semibold text-white truncate">{book.title}</h3>
                      <p className="text-sm text-[#9CA3AF] truncate">{book.author}</p>
                      
                      {/* Confirm Handoff Button */}
                      <Link 
                        href={`/handoff/${handoff.id}`}
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirm Handoff
                      </Link>
                    </div>
                    
                    {/* Chevron */}
                    <Link href={`/books/${book.id}`} className="flex items-center text-[#6B7280]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Currently Borrowed */}
      {borrowedCount > 0 && (
        <section className="mb-8">
          <h2 
            className="text-lg font-semibold text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Currently Borrowed
          </h2>
          
          <div className="space-y-3">
            {borrowedBooks?.map((book: any) => {
              const daysBorrowed = getDaysBorrowed(book.borrowed_at)
              
              return (
                <div key={book.id} className="bg-[#1E293B] rounded-xl p-4">
                  <div className="flex gap-4">
                    <BookCover
                      coverUrl={book.cover_url}
                      title={book.title}
                      author={book.author}
                      isbn={book.isbn}
                      className="w-20 h-28 rounded-lg shadow-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      {/* Borrowed from badge */}
                      <span className="inline-block px-3 py-1 bg-[#55B2DE] text-white text-xs font-medium rounded-full mb-2">
                        Borrowed from {book.owner?.full_name || 'Unknown'}
                      </span>
                      
                      <h3 className="font-semibold text-white truncate">{book.title}</h3>
                      <p className="text-sm text-[#9CA3AF] truncate">{book.author}</p>
                      
                      {/* Days with you */}
                      {daysBorrowed !== null && (
                        <div className="flex items-center gap-2 mt-3 text-[#55B2DE] text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>With you for {daysBorrowed} day{daysBorrowed !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      
                      {/* Done Reading Button */}
                      <div className="mt-4">
                        <DoneReadingButton 
                          bookId={book.id}
                          bookTitle={book.title}
                          status={book.status}
                          ownerName={book.owner?.full_name}
                          variant="outline"
                        />
                      </div>
                    </div>
                    
                    {/* Chevron */}
                    <Link href={`/books/${book.id}`} className="flex items-center text-[#6B7280]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* In Queue */}
      {queueCount > 0 && (
        <section className="mb-8">
          <h2 
            className="text-lg font-semibold text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            In Queue
          </h2>
          
          <div className="space-y-3">
            {queueEntries?.map((entry: any) => {
              const book = entry.book
              if (!book) return null

              return (
                <div key={entry.id} className="bg-[#1E293B] rounded-xl p-4">
                  <div className="flex gap-4">
                    <BookCover
                      coverUrl={book.cover_url}
                      title={book.title}
                      author={book.author}
                      isbn={book.isbn}
                      className="w-20 h-28 rounded-lg shadow-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      {/* Borrowed from badge */}
                      <span className="inline-block px-3 py-1 bg-[#55B2DE] text-white text-xs font-medium rounded-full mb-2">
                        Borrowed from {book.owner?.full_name || 'Unknown'}
                      </span>
                      
                      <h3 className="font-semibold text-white truncate">{book.title}</h3>
                      <p className="text-sm text-[#9CA3AF] truncate">{book.author}</p>
                      
                      {/* Queue position */}
                      <p className="mt-2 text-sm text-[#9CA3AF]">
                        #{entry.position} in queue
                      </p>
                    </div>
                    
                    {/* Chevron */}
                    <Link href={`/books/${book.id}`} className="flex items-center text-[#6B7280]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Reading History */}
      {readingHistory && readingHistory.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-lg font-semibold text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Reading History
          </h2>
          
          <div className="space-y-3">
            {readingHistory.map((event: any) => (
              <Link 
                key={event.id} 
                href={event.metadata?.book_id ? `/books/${event.metadata.book_id}` : '#'}
                className="bg-[#1E293B] rounded-xl p-4 flex items-center gap-4 hover:bg-[#253449] transition"
              >
                {event.book?.cover_url ? (
                  <img 
                    src={event.book.cover_url} 
                    alt={event.book.title || 'Book cover'}
                    className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-16 bg-[#27272A] rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    📖
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">
                    {event.book?.title || 'Unknown Book'}
                  </h3>
                  <p className="text-sm text-[#9CA3AF]">
                    Returned {new Date(event.timestamp || event.created_at).toLocaleDateString()}
                  </p>
                </div>
                <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {borrowedCount === 0 && queueCount === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 bg-[#1E293B] rounded-full flex items-center justify-center mb-6">
            <span className="text-5xl">📚</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Your shelf is empty</h2>
          <p className="text-[#9CA3AF] text-center mb-6 max-w-sm">
            You're not borrowing any books right now. Visit a circle to discover and borrow books from friends!
          </p>
          <Link 
            href="/circles" 
            className="px-6 py-3 bg-[#55B2DE] hover:bg-[#4A9BC5] text-white font-medium rounded-xl transition-colors"
          >
            Browse Circles
          </Link>
        </div>
      )}

    </div>
  )
}

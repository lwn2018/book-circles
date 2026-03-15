import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import BookCover from '@/app/components/BookCover'
import GiftRecipientSelector from './GiftRecipientSelector'

export default async function GiftBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/signin')

  // Get the book
  const { data: book, error } = await supabase
    .from('books')
    .select('*, owner:profiles!books_owner_id_fkey(id, full_name)')
    .eq('id', id)
    .single()

  if (error || !book) notFound()

  // Must be owner to gift
  if (book.owner_id !== user.id) {
    redirect(`/books/${id}`)
  }

  // Can't gift a book that's currently borrowed
  if (book.status === 'borrowed' || book.status === 'in_transit') {
    redirect(`/books/${id}`)
  }

  // Get circles the book is shared with
  const { data: bookCircles } = await supabase
    .from('book_circle_visibility')
    .select('circle_id')
    .eq('book_id', id)
    .eq('is_visible', true)

  const circleIds = bookCircles?.map(bc => bc.circle_id) || []

  // Get members from those circles (excluding current user)
  let potentialRecipients: any[] = []
  if (circleIds.length > 0) {
    const { data: members } = await supabase
      .from('circle_members')
      .select(`
        user_id,
        circle_id,
        profiles:user_id (
          id,
          full_name,
          avatar_type,
          avatar_id,
          avatar_url
        ),
        circles:circle_id (
          id,
          name
        )
      `)
      .in('circle_id', circleIds)
      .neq('user_id', user.id)

    // Dedupe by user_id and group circle names
    const recipientMap = new Map<string, any>()
    for (const member of members || []) {
      if (!member.profiles) continue
      const existing = recipientMap.get(member.user_id)
      if (existing) {
        existing.circles.push(member.circles)
      } else {
        recipientMap.set(member.user_id, {
          ...member.profiles,
          circles: [member.circles]
        })
      }
    }
    potentialRecipients = Array.from(recipientMap.values())
  }

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-6 pb-32">
      {/* Header */}
      <Link 
        href={`/books/${id}`}
        className="inline-flex items-center text-white/80 hover:text-white mb-4"
      >
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="sr-only">Back</span>
      </Link>

      <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        Gift This Book
      </h1>
      <p className="text-white/60 text-sm mb-6">
        Transfer ownership permanently to someone in your circles.
      </p>

      {/* Book preview */}
      <div className="bg-[#1E293B] rounded-xl p-4 mb-6 flex items-center gap-4">
        <BookCover
          coverUrl={book.cover_url}
          title={book.title}
          author={book.author}
          isbn={book.isbn}
          className="w-16 h-24 rounded-lg shadow-lg flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold truncate">{book.title}</h2>
          {book.author && (
            <p className="text-white/60 text-sm truncate">{book.author}</p>
          )}
          <p className="text-pink-400 text-sm mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            This is a gift
          </p>
        </div>
      </div>

      {potentialRecipients.length === 0 ? (
        <div className="bg-white/5 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="text-white text-lg font-semibold mb-2">
            No recipients available
          </h2>
          <p className="text-white/60 text-sm mb-6">
            Make sure this book is visible in at least one circle with other members.
          </p>
          <Link
            href={`/books/${id}`}
            className="inline-block px-6 py-3 bg-[#55B2DE] text-white rounded-xl font-medium hover:bg-[#4A9FCB] transition-colors"
          >
            Back to Book
          </Link>
        </div>
      ) : (
        <GiftRecipientSelector
          bookId={id}
          bookTitle={book.title}
          recipients={potentialRecipients}
        />
      )}
    </div>
  )
}

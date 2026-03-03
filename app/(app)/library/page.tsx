import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LibraryContent from './LibraryContent'

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

  // Get pending handoffs where user is the receiver
  const { data: pendingHandoffs } = await supabase
    .from('handoff_confirmations')
    .select(`
      *,
      book:book_id (
        id,
        title,
        cover_url
      ),
      giver:giver_id (
        id,
        full_name
      )
    `)
    .eq('receiver_id', user.id)
    .is('both_confirmed_at', null)
    .order('created_at', { ascending: false })

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

  return (
    <div className="min-h-screen -mx-4 -my-6 px-4 py-6" style={{ background: '#121212' }}>
      {/* Pending Handoffs */}
      {pendingHandoffs && pendingHandoffs.length > 0 && (
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-bold text-white mb-3">📬 Pending Handoffs ({pendingHandoffs.length})</h2>
          <div className="space-y-3">
            {pendingHandoffs.map((handoff: any) => (
              <Link
                key={handoff.id}
                href={`/handoff/${handoff.id}`}
                className="flex items-center gap-3 p-3 bg-[#27272A] rounded-lg border border-amber-600/30 hover:border-amber-500/50 transition-colors"
              >
                {handoff.book.cover_url ? (
                  <img 
                    src={handoff.book.cover_url} 
                    alt={handoff.book.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-16 bg-zinc-700 rounded flex items-center justify-center">
                    <span className="text-xl">📚</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{handoff.book.title}</p>
                  <p className="text-sm text-zinc-400">
                    Waiting for handoff with {handoff.giver.full_name}
                  </p>
                </div>
                <div className="text-orange-500 font-medium text-sm">
                  Confirm →
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <LibraryContent
        books={booksWithVisibility as any}
        circles={circles as any}
        userId={user.id}
        defaultBrowseView={profile?.default_browse_view || 'card'}
      />
    </div>
  )
}

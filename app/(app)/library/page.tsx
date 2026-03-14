import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LibraryContent from './LibraryContent'

export default async function MyLibraryTab() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

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

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-6">
      <LibraryContent
        books={booksWithVisibility as any}
        circles={circles as any}
        userId={user.id}
        defaultBrowseView={profile?.default_browse_view || 'card'}
      />
    </div>
  )
}

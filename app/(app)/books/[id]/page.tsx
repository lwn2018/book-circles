import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/app/components/BackButton'
import BookCover from '@/app/components/BookCover'
import Avatar from '@/app/components/Avatar'

export const revalidate = 0

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getActivityText(action: string, metadata: any) {
  switch (action) {
    case 'book_borrowed': return `${metadata?.borrower_name || 'Someone'} borrowed this book`
    case 'queue_joined': return `${metadata?.user_name || 'Someone'} joined the queue`
    case 'book_returned': return 'Book was returned'
    case 'book_added': return 'Added to library'
    case 'book_gifted': return `Gifted to ${metadata?.receiver_name || 'someone'}`
    default: return action.replace(/_/g, ' ')
  }
}

export default async function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: book, error } = await supabase
    .from('books')
    .select(`*, owner:profiles!books_owner_id_fkey(id, full_name, avatar_type, avatar_id, avatar_url),
      current_borrower:profiles!books_current_borrower_id_fkey(id, full_name)`)
    .eq('id', id)
    .single()

  if (error || !book) notFound()

  const { data: circleVisibility } = await supabase
    .from('book_circle_visibility')
    .select('circle_id, circles(id, name)')
    .eq('book_id', id)
    .limit(1)
    .single()

  const { data: recentActivity } = await supabase
    .from('user_events')
    .select('id, action, metadata, created_at, user_id, profiles(full_name, avatar_type, avatar_id, avatar_url)')
    .eq('book_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  const isOwner = book.owner_id === user.id
  const circleData = circleVisibility?.circles
  const circle = Array.isArray(circleData) ? circleData[0] : circleData
  const publishYear = book.publish_date ? new Date(book.publish_date).getFullYear().toString() : null
  const statusLabel = book.status === 'available' ? 'Available' : book.status === 'borrowed' ? 'Currently Reading' : book.status === 'in_transit' ? 'In Transit' : 'Off Shelf'

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-6 pb-32">
      <BackButton fallbackHref="/library" />
      
      <h1 className="text-2xl font-bold text-white mb-1 mt-4" style={{ fontFamily: 'var(--font-display)' }}>
        My Library
      </h1>
      <p className="text-[#9CA3AF] text-sm mb-6">View book information and manage its availability.</p>

      <div className="bg-[#1E293B] rounded-xl p-6 mb-6 flex justify-center">
        <div className="relative w-40 h-56 rounded-lg overflow-hidden shadow-xl">
          <BookCover coverUrl={book.cover_url} title={book.title} author={book.author} isbn={book.isbn} className="w-full h-full object-cover" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>{book.title}</h2>
      <p className="text-[#9CA3AF] mb-3">{book.author}</p>

      <div className="flex items-center gap-4 mb-4 text-sm text-[#9CA3AF]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Owned by {isOwner ? 'You' : book.owner?.full_name}</span>
        </div>
        {circle && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{circle.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1E293B] rounded-xl p-4">
          <p className="text-xs text-[#55B2DE] mb-1">Status</p>
          <p className="text-white font-medium">{statusLabel}</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl p-4">
          <p className="text-xs text-[#55B2DE] mb-1">Circle</p>
          <p className="text-white font-medium">{circle?.name || 'Not shared'}</p>
        </div>
      </div>

      <div className="bg-[#1E293B] rounded-xl p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {book.genres && book.genres.length > 0 && (
            <div><p className="text-xs text-[#55B2DE] mb-1">Genre</p><p className="text-white">{Array.isArray(book.genres) ? book.genres.join(', ') : book.genres}</p></div>
          )}
          {publishYear && (<div><p className="text-xs text-[#55B2DE] mb-1">Published</p><p className="text-white">{publishYear}</p></div>)}
          {book.page_count && (<div><p className="text-xs text-[#55B2DE] mb-1">Pages</p><p className="text-white">{book.page_count}</p></div>)}
          {book.language && (<div><p className="text-xs text-[#55B2DE] mb-1">Language</p><p className="text-white capitalize">{book.language}</p></div>)}
        </div>
        {book.description && (
          <div className="mt-4 pt-4 border-t border-[#333]">
            <p className="text-xs text-[#55B2DE] mb-2">Description</p>
            <p className="text-[#9CA3AF] text-sm leading-relaxed">{book.description}</p>
          </div>
        )}
      </div>

      {recentActivity && recentActivity.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-center gap-3">
                <Avatar avatarType={activity.profiles?.avatar_type || 'initials'} avatarId={activity.profiles?.avatar_id || null} avatarUrl={activity.profiles?.avatar_url || null} userName={activity.profiles?.full_name || 'User'} userId={activity.user_id || ''} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{getActivityText(activity.action, activity.metadata)}</p>
                  <p className="text-[#6B7280] text-xs">{formatTimeAgo(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOwner && (
        <div className="space-y-3">
          <button className="w-full bg-[#1E293B] rounded-xl p-4 flex items-center justify-between hover:bg-[#27272A] transition-colors">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              <span className="text-white">Hide Book</span>
            </div>
            <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <button className="w-full bg-[#1E293B] rounded-xl p-4 flex items-center justify-between hover:bg-[#27272A] transition-colors">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              <span className="text-white">Take Off Shelf</span>
            </div>
            <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          {book.status === 'available' && (
            <Link href={`/books/${id}/gift`} className="w-full bg-[#1E293B] rounded-xl p-4 flex items-center justify-between hover:bg-[#27272A] transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                <span className="text-white">Gift This Book</span>
              </div>
              <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          )}
          <button className="w-full bg-[#1E293B] rounded-xl p-4 flex items-center justify-between hover:bg-[#27272A] transition-colors">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-white">Circle Visibility Settings</span>
            </div>
            <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}

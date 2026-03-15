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

      {/* Buy on Amazon */}
      {book.isbn && (
        <a
          href={`https://www.amazon.ca/s?k=${book.isbn}&tag=pagepass-20`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-[#FF9900] rounded-xl p-4 mb-6 flex items-center justify-center gap-3 hover:bg-[#FFB84D] transition-colors"
        >
          <svg className="w-6 h-6 text-[#232F3E]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595.379-.144.754-.356 1.151-.516.088-.032.191-.04.283.02.092.06.14.168.122.276-.04.256-.216.388-.404.472-.96.464-1.955.88-2.983 1.168-2.116.596-4.296.896-6.536.896-2.84 0-5.576-.52-8.184-1.56a22.05 22.05 0 01-3.768-2.052c-.175-.12-.188-.26-.116-.376l.008-.008-.238.13zm6.89-8.236c0 1.476-.04 2.704.008 3.928.016.496.188.916.588 1.198.252.176.564.26.872.26.592 0 1.232-.152 1.588-.352 1.04-.584 1.56-1.512 1.756-2.676.16-.948.016-1.868-.388-2.74-.404-.872-1.072-1.432-1.936-1.736-.544-.192-1.12-.264-1.696-.264-.624 0-1.248.12-1.848.352-.164.064-.328.144-.408.252-.108.148-.16.336-.16.528v1.25h1.624zm10.5-3.704c.088 0 .168.028.232.08.12.1.16.256.096.392-.256.52-.664.912-1.216 1.18-.432.208-.932.296-1.396.296h-.032c-.2 0-.396-.024-.58-.056-.252-.044-.556-.148-.772-.364-.084-.084-.144-.184-.184-.296-.036-.1-.052-.188-.052-.28V2.784c0-.084.012-.164.036-.24.044-.14.14-.252.268-.328.12-.072.268-.1.408-.1h.712c.076 0 .148.012.216.036.12.04.224.124.284.24l.992 1.744c.06.1.144.168.244.2.1.032.208.036.312.016.104-.02.192-.068.256-.14.044-.048.076-.104.1-.168L18.58 2.4c.06-.116.164-.2.284-.24.068-.024.14-.036.216-.036h.74c.14 0 .268.036.388.1.12.072.216.18.26.316.028.08.04.16.04.244v4.172c0 .264-.192.472-.44.472h-.768c-.26 0-.464-.2-.464-.456V4.236c0-.048-.024-.084-.06-.1-.02-.008-.048-.004-.068.012l-.024.032-1.144 2.04c-.1.18-.284.284-.48.284h-.608c-.2 0-.384-.108-.48-.284l-1.14-2.04-.024-.032c-.02-.016-.048-.02-.068-.012-.036.016-.06.052-.06.1v2.736c0 .252-.208.456-.464.456h-.768c-.248 0-.44-.208-.44-.472V2.8c0-.088.012-.172.044-.248.044-.136.14-.244.26-.316.12-.064.252-.1.392-.1h.736z"/>
          </svg>
          <span className="text-[#232F3E] font-semibold">Buy on Amazon</span>
          <svg className="w-4 h-4 text-[#232F3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

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

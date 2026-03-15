import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/app/components/BackButton'
import BookCover from '@/app/components/BookCover'
import Avatar from '@/app/components/Avatar'
import BookActions from './BookActions'

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
      current_borrower:profiles!books_current_borrower_id_fkey(id, full_name),
      book_queue(id, user_id, position)`)
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
  const isBorrower = book.current_borrower_id === user.id
  const inQueue = book.book_queue?.some((q: any) => q.user_id === user.id)
  const circleData = circleVisibility?.circles
  const circle = Array.isArray(circleData) ? circleData[0] : circleData
  const publishYear = book.publish_date ? new Date(book.publish_date).getFullYear().toString() : null
  
  // Status display
  let statusLabel = 'Available'
  let statusColor = { bg: '#1A4A2A', text: '#4ADE80' }
  if (book.status === 'off_shelf') {
    statusLabel = 'Off Shelf'
    statusColor = { bg: '#2A2A2A', text: '#6B7280' }
  } else if (book.status === 'borrowed') {
    statusLabel = isBorrower ? 'You\'re Reading' : 'Borrowed'
    statusColor = { bg: '#2A2A1A', text: '#FACC15' }
  } else if (book.status === 'in_transit') {
    statusLabel = 'In Transit'
    statusColor = { bg: '#1A2A3A', text: '#55B2DE' }
  } else if (book.gift_on_borrow) {
    statusLabel = '🎁 Gift'
    statusColor = { bg: '#3A1A2A', text: '#EC4899' }
  }

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-6 pb-32">
      <BackButton fallbackHref="/library" />

      {/* Compact Header: Cover + Title + Status */}
      <div className="flex gap-4 mt-4 mb-4">
        {/* Book Cover */}
        <div className="flex-shrink-0 w-24 h-36 rounded-lg overflow-hidden shadow-lg">
          <BookCover coverUrl={book.cover_url} title={book.title} author={book.author} isbn={book.isbn} className="w-full h-full object-cover" />
        </div>
        
        {/* Title, Author, Status */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h1 className="text-xl font-bold text-white mb-1 line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
            {book.title}
          </h1>
          <p className="text-[#9CA3AF] text-sm mb-2 truncate">{book.author}</p>
          
          {/* Status Badge */}
          <span 
            className="inline-flex self-start px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Owner & Circle Info */}
      <div className="flex items-center gap-4 mb-4 text-sm text-[#9CA3AF]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{isOwner ? 'You own this' : `Owned by ${book.owner?.full_name}`}</span>
        </div>
        {circle && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <Link href={`/circles/${circle.id}`} className="hover:text-[#55B2DE] transition">
              {circle.name}
            </Link>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS - Above the fold */}
      <BookActions 
        book={book}
        userId={user.id}
        circleId={circle?.id}
        isOwner={isOwner}
        isBorrower={isBorrower}
        inQueue={inQueue}
      />

      {/* Book Details (scrollable) */}
      <div className="bg-[#1E293B] rounded-xl p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {book.genres && book.genres.length > 0 && (
            <div><p className="text-xs text-[#55B2DE] mb-1">Genre</p><p className="text-white text-sm">{Array.isArray(book.genres) ? book.genres.join(', ') : book.genres}</p></div>
          )}
          {publishYear && (<div><p className="text-xs text-[#55B2DE] mb-1">Published</p><p className="text-white text-sm">{publishYear}</p></div>)}
          {book.page_count && (<div><p className="text-xs text-[#55B2DE] mb-1">Pages</p><p className="text-white text-sm">{book.page_count}</p></div>)}
          {book.language && (<div><p className="text-xs text-[#55B2DE] mb-1">Language</p><p className="text-white text-sm capitalize">{book.language}</p></div>)}
        </div>
        {book.description && (
          <div className="mt-4 pt-4 border-t border-[#334155]">
            <p className="text-xs text-[#55B2DE] mb-2">Description</p>
            <p className="text-[#9CA3AF] text-sm leading-relaxed line-clamp-4">{book.description}</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar 
                  avatarType={activity.profiles?.avatar_type} 
                  avatarId={activity.profiles?.avatar_id} 
                  avatarUrl={activity.profiles?.avatar_url} 
                  userName={activity.profiles?.full_name || 'User'} userId={activity.user_id} 
                  size="sm" 
                />
                <div className="flex-1">
                  <p className="text-white text-sm">{getActivityText(activity.action, activity.metadata)}</p>
                  <p className="text-[#6B7280] text-xs">{formatTimeAgo(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Owner Actions */}
      {isOwner && (
        <div className="bg-[#1E293B] rounded-xl p-4">
          <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Manage Book</h3>
          <div className="flex flex-wrap gap-2">
            <Link href={`/books/${id}/edit`} className="px-4 py-2 bg-[#27272A] text-white text-sm rounded-lg hover:bg-[#3F3F46] transition">
              Edit Details
            </Link>
            <Link href={`/books/${id}/visibility`} className="px-4 py-2 bg-[#27272A] text-white text-sm rounded-lg hover:bg-[#3F3F46] transition">
              Circle Visibility
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

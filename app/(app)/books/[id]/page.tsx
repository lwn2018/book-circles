import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import BookCover from '@/app/components/BookCover'
import Avatar from '@/app/components/Avatar'

export const revalidate = 0

function ActivityItem({ activity }: { activity: any }) {
  const getActivityText = (action: string, metadata: any) => {
    switch (action) {
      case 'handoff_complete':
      case 'book_received':
        return `${metadata?.receiver_name || 'Someone'} received this book`
      case 'book_borrowed':
        return `${metadata?.borrower_name || 'Someone'} borrowed this book`
      case 'book_returned':
        return 'Returned to owner'
      case 'book_added':
        return 'Added to library'
      case 'queue_joined':
        return `${metadata?.user_name || 'Someone'} joined the queue`
      case 'book_gifted':
        return `Gifted to ${metadata?.receiver_name || 'someone'}`
      default:
        return action.replace(/_/g, ' ')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar
        avatarType={activity.profiles?.avatar_type || 'initials'}
        avatarId={activity.profiles?.avatar_id || null}
        avatarUrl={activity.profiles?.avatar_url || null}
        userName={activity.profiles?.full_name || 'User'}
        userId={activity.user_id || ''}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">
          {getActivityText(activity.action, activity.metadata)}
        </p>
        <p className="text-gray-500 text-xs">{formatDate(activity.created_at)}</p>
      </div>
    </div>
  )
}

function MenuItem({ icon, label, href, onClick }: { 
  icon: React.ReactNode; label: string; href?: string; onClick?: () => void 
}) {
  const content = (
    <div className="flex items-center justify-between py-4 px-4 hover:bg-[#1E293B] transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-gray-400">{icon}</span>
        <span className="text-white">{label}</span>
      </div>
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
  if (href) return <Link href={href}>{content}</Link>
  return <button onClick={onClick} className="w-full text-left">{content}</button>
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

  return (
    <div className="min-h-screen bg-[#121212] pb-8">
      <div className="sticky top-0 z-10 bg-[#121212] px-4 pt-12 pb-4">
        <Link href="/library" className="inline-block mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white">My Library</h1>
        <p className="text-gray-400 text-sm">View book information and manage its availability.</p>
      </div>

      <div className="px-4">
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-72 rounded-lg overflow-hidden shadow-2xl">
            <BookCover coverUrl={book.cover_url} title={book.title} author={book.author} fill className="object-cover" />
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white">{book.title}</h2>
          <p className="text-gray-400">{book.author}</p>
        </div>

        <div className="flex items-center justify-center gap-6 mb-6 text-sm text-gray-400">
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

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#1E293B] rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <p className="text-white font-medium">
              {book.status === 'available' ? 'Available' : book.status === 'borrowed' ? 'Currently Reading' : book.status === 'in_transit' ? 'In Transit' : 'Off Shelf'}
            </p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Circle</p>
            <p className="text-white font-medium">{circle?.name || 'Not shared'}</p>
          </div>
        </div>

        <div className="bg-[#1E293B] rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {book.genres && book.genres.length > 0 && (
              <div><p className="text-xs text-gray-400 mb-1">Genre</p><p className="text-white">{Array.isArray(book.genres) ? book.genres.join(', ') : book.genres}</p></div>
            )}
            {publishYear && (
              <div><p className="text-xs text-gray-400 mb-1">Published</p><p className="text-white">{publishYear}</p></div>
            )}
            {book.page_count && (
              <div><p className="text-xs text-gray-400 mb-1">Pages</p><p className="text-white">{book.page_count}</p></div>
            )}
            {book.language && (
              <div><p className="text-xs text-gray-400 mb-1">Language</p><p className="text-white">{book.language}</p></div>
            )}
          </div>
          {book.description && (
            <div>
              <p className="text-xs text-[#55B2DE] mb-2 font-medium">Description</p>
              <p className="text-gray-300 text-sm leading-relaxed">{book.description}</p>
            </div>
          )}
        </div>

        {recentActivity && recentActivity.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-[#55B2DE] uppercase tracking-wider mb-3">Recent Activity</h3>
            <div className="space-y-1">
              {recentActivity.map((activity: any) => <ActivityItem key={activity.id} activity={activity} />)}
            </div>
          </div>
        )}

        {isOwner && (
          <div className="bg-[#121212] border-t border-gray-800 -mx-4 mt-6">
            <MenuItem
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
              label="Hide Book"
            />
            <MenuItem
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
              label="Take Off Shelf"
            />
            <MenuItem
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              label="Circle Visibility Settings"
            />
          </div>
        )}
      </div>
    </div>
  )
}

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import BookCover from '@/app/components/BookCover'
import Avatar from '@/app/components/Avatar'

// Disable caching - always fetch fresh data
export const revalidate = 0

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const badges: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    available: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Available', icon: '✓' },
    borrowed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Currently Reading', icon: '📖' },
    in_transit: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'In Transit', icon: '🔄' },
    off_shelf: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Off Shelf', icon: '📚' },
  }
  
  const badge = badges[status] || badges.available
  
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${badge.bg}`}>
      <span>{badge.icon}</span>
      <div>
        <p className="text-xs text-gray-400">Status</p>
        <p className={`font-medium ${badge.text}`}>{badge.label}</p>
      </div>
    </div>
  )
}

// Activity item component
function ActivityItem({ activity }: { activity: any }) {
  const getActivityText = (action: string, metadata: any) => {
    switch (action) {
      case 'handoff_complete':
      case 'book_received':
        return `Received by ${metadata?.receiver_name || 'someone'}`
      case 'book_borrowed':
        return `Borrowed by ${metadata?.borrower_name || 'someone'}`
      case 'book_returned':
        return `Returned to owner`
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

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'handoff_complete':
      case 'book_received':
        return '📬'
      case 'book_borrowed':
        return '📖'
      case 'book_returned':
        return '↩️'
      case 'book_added':
        return '➕'
      case 'queue_joined':
        return '📋'
      case 'book_gifted':
        return '🎁'
      default:
        return '📚'
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
    <div className="flex items-start gap-3 py-3 border-b border-gray-800 last:border-0">
      <div className="w-10 h-10 bg-[#1E293B] rounded-full flex items-center justify-center text-lg">
        {getActivityIcon(activity.action)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">
          {getActivityText(activity.action, activity.metadata)}
        </p>
        <p className="text-gray-500 text-xs mt-0.5">
          {formatDate(activity.created_at)}
        </p>
      </div>
    </div>
  )
}

export default async function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get book details with owner and current borrower info
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select(`
      *,
      owner:owner_id (
        id,
        full_name,
        avatar_type,
        avatar_id,
        avatar_url
      ),
      current_borrower:current_borrower_id (
        id,
        full_name,
        avatar_type,
        avatar_id,
        avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (bookError || !book) {
    notFound()
  }

  // Get circles this book is visible in
  const { data: circleVisibility } = await supabase
    .from('book_circle_visibility')
    .select(`
      circle_id,
      is_visible,
      circles (
        id,
        name
      )
    `)
    .eq('book_id', id)
    .eq('is_visible', true)

  // Get user's circles to find which one this book belongs to
  const { data: userCircles } = await supabase
    .from('circle_members')
    .select(`
      circle_id,
      circles (
        id,
        name
      )
    `)
    .eq('user_id', book.owner_id)

  // Find the primary circle for this book
  const bookCircle = circleVisibility?.[0]?.circles || userCircles?.[0]?.circles || null

  // Get recent activity for this book
  const { data: recentActivity } = await supabase
    .from('activity_ledger')
    .select('*')
    .eq('book_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get queue for this book
  const { data: queue } = await supabase
    .from('book_queue')
    .select(`
      *,
      profiles (
        id,
        full_name
      )
    `)
    .eq('book_id', id)
    .order('position', { ascending: true })

  // Check if current user is in queue
  const userQueuePosition = queue?.find(q => q.user_id === user.id)?.position

  // Check if current user owns this book
  const isOwner = book.owner_id === user.id

  // Check if current user is borrowing this book
  const isBorrower = book.current_borrower_id === user.id

  return (
    <div className="min-h-screen bg-[#121212] -mx-4 -my-6">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur px-4 py-4">
        <Link 
          href="javascript:history.back()"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="sr-only">Back</span>
        </Link>
      </div>

      <div className="px-4 pb-32">
        {/* Book Cover - Large Centered */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <BookCover
              coverUrl={book.cover_url}
              title={book.title}
              author={book.author}
              isbn={book.isbn}
              status={book.status}
              className="w-48 h-72 object-cover rounded-xl shadow-2xl"
            />
            {book.gift_on_borrow && (
              <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                🎁 Gift
              </div>
            )}
          </div>
        </div>

        {/* Title & Author */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1 font-arimo">
            {book.title}
          </h1>
          {book.author && (
            <p className="text-gray-400 text-lg">
              by {book.author}
            </p>
          )}
        </div>

        {/* Info Cards - Status & Circle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatusBadge status={book.status} />
          
          {bookCircle ? (
            <Link 
              href={`/circles/${bookCircle.id}`}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1E293B] hover:bg-[#2d3a4d] transition-colors"
            >
              <span>👥</span>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Circle</p>
                <p className="font-medium text-white truncate">{bookCircle.name}</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1E293B]">
              <span>👥</span>
              <div>
                <p className="text-xs text-gray-400">Circle</p>
                <p className="font-medium text-gray-500">Not in circle</p>
              </div>
            </div>
          )}
        </div>

        {/* Owner Info */}
        <div className="bg-[#1E293B] rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Avatar
              avatarType={book.owner?.avatar_type}
              avatarId={book.owner?.avatar_id}
              avatarUrl={book.owner?.avatar_url}
              userName={book.owner?.full_name || 'Unknown'}
              userId={book.owner?.id || ''}
              size="md"
            />
            <div>
              <p className="text-xs text-gray-400">Owned by</p>
              <p className="font-medium text-white">{book.owner?.full_name || 'Unknown'}</p>
            </div>
            {isOwner && (
              <span className="ml-auto text-xs bg-[#55B2DE]/20 text-[#55B2DE] px-2 py-1 rounded-full">
                You
              </span>
            )}
          </div>

          {/* Current Borrower (if different from owner) */}
          {book.current_borrower && book.current_borrower_id !== book.owner_id && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-700">
              <Avatar
                avatarType={book.current_borrower?.avatar_type}
                avatarId={book.current_borrower?.avatar_id}
                avatarUrl={book.current_borrower?.avatar_url}
                userName={book.current_borrower?.full_name || 'Unknown'}
                userId={book.current_borrower?.id || ''}
                size="md"
              />
              <div>
                <p className="text-xs text-gray-400">Currently with</p>
                <p className="font-medium text-white">{book.current_borrower?.full_name || 'Unknown'}</p>
              </div>
              {isBorrower && (
                <span className="ml-auto text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                  You
                </span>
              )}
            </div>
          )}
        </div>

        {/* Queue Info (if there's a queue) */}
        {queue && queue.length > 0 && (
          <div className="bg-[#1E293B] rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span>📋</span> Queue
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                {queue.length} waiting
              </span>
            </h3>
            <div className="space-y-2">
              {queue.slice(0, 5).map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-2 text-sm">
                  <span className="text-purple-400 font-mono text-xs w-6">#{entry.position}</span>
                  <span className="text-gray-300">{entry.profiles?.full_name}</span>
                  {entry.user_id === user.id && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full ml-auto">
                      You
                    </span>
                  )}
                </div>
              ))}
              {queue.length > 5 && (
                <p className="text-xs text-gray-500">+{queue.length - 5} more</p>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-[#1E293B] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>📊</span> Recent Activity
          </h3>
          {recentActivity && recentActivity.length > 0 ? (
            <div>
              {recentActivity.map((activity: any) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm py-4 text-center">
              No activity yet
            </p>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1E293B] border-t border-gray-800 px-4 py-4 safe-area-bottom">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Action 1: Borrow/Request or View Queue Position */}
          {isOwner ? (
            <Link
              href={`/library`}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#55B2DE] transition-colors"
            >
              <div className="w-12 h-12 bg-[#121212] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-xs">Edit</span>
            </Link>
          ) : isBorrower ? (
            <Link
              href={`/shelf`}
              className="flex flex-col items-center gap-1 text-[#55B2DE]"
            >
              <div className="w-12 h-12 bg-[#55B2DE]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs">Done Reading</span>
            </Link>
          ) : userQueuePosition ? (
            <div className="flex flex-col items-center gap-1 text-purple-400">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="font-bold">#{userQueuePosition}</span>
              </div>
              <span className="text-xs">In Queue</span>
            </div>
          ) : book.status === 'available' ? (
            <button
              className="flex flex-col items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-xs">Borrow</span>
            </button>
          ) : (
            <button
              className="flex flex-col items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
            >
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs">Join Queue</span>
            </button>
          )}

          {/* Action 2: Share */}
          <button
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#55B2DE] transition-colors"
          >
            <div className="w-12 h-12 bg-[#121212] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <span className="text-xs">Share</span>
          </button>

          {/* Action 3: More options */}
          <button
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#55B2DE] transition-colors"
          >
            <div className="w-12 h-12 bg-[#121212] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </div>
            <span className="text-xs">More</span>
          </button>
        </div>
      </div>
    </div>
  )
}

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DoneReadingButton from './DoneReadingButton'
import BatchHandoffGroup from '../handoffs/BatchHandoffGroup'
import BookCover from '@/app/components/BookCover'
import Avatar from '@/app/components/Avatar'

// Group handoffs by the other party
function groupHandoffsByPerson(handoffs: any[], isOutgoing: boolean) {
  const groups: Record<string, any[]> = {}
  
  for (const handoff of handoffs) {
    const otherPersonId = isOutgoing ? handoff.receiver?.id : handoff.giver?.id
    if (!otherPersonId) continue
    
    if (!groups[otherPersonId]) {
      groups[otherPersonId] = []
    }
    groups[otherPersonId].push(handoff)
  }
  
  return groups
}

// Helper to get contact info
function getContactInfo(profile: any): { type: 'phone' | 'email' | null, value: string | null } {
  if (profile?.contact_preference_value && profile?.contact_preference_type && profile?.contact_preference_type !== 'none') {
    return { type: profile.contact_preference_type, value: profile.contact_preference_value }
  }
  return { type: null, value: null }
}

// Status badge component
function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const badges: Record<string, { bg: string; text: string; label: string }> = {
    incoming: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Incoming' },
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
    reading: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Reading' },
    overdue: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Overdue' },
    queued: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'In Queue' },
  }
  
  const badge = badges[status] || badges.reading
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} ${className}`}>
      {badge.label}
    </span>
  )
}

export default async function MyShelfTab() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get pending handoffs where user is the giver (outgoing)
  const { data: pendingHandoffsOutgoing } = await supabase
    .from('handoff_confirmations')
    .select(`
      *,
      books:book_id (
        id,
        title,
        author,
        cover_url,
        isbn,
        gift_on_borrow
      ),
      giver:giver_id (
        id,
        full_name,
        avatar_type,
        avatar_id,
        avatar_url,
        contact_preference_type,
        contact_preference_value
      ),
      receiver:receiver_id (
        id,
        full_name,
        avatar_type,
        avatar_id,
        avatar_url,
        contact_preference_type,
        contact_preference_value
      )
    `)
    .eq('giver_id', user.id)
    .is('both_confirmed_at', null)
    .order('created_at', { ascending: false })

  // Get pending handoffs where user is the receiver (incoming)
  const { data: pendingHandoffsIncoming } = await supabase
    .from('handoff_confirmations')
    .select(`
      *,
      books:book_id (
        id,
        title,
        author,
        cover_url,
        isbn,
        gift_on_borrow
      ),
      giver:giver_id (
        id,
        full_name,
        avatar_type,
        avatar_id,
        avatar_url,
        contact_preference_type,
        contact_preference_value
      ),
      receiver:receiver_id (
        id,
        full_name,
        avatar_type,
        avatar_id,
        avatar_url,
        contact_preference_type,
        contact_preference_value
      )
    `)
    .eq('receiver_id', user.id)
    .is('both_confirmed_at', null)
    .order('created_at', { ascending: false })

  // Get books user is currently borrowing
  const { data: borrowedBooks, error: borrowedError } = await supabase
    .from('books')
    .select(`
      *,
      owner:owner_id (
        id,
        full_name,
        avatar_type,
        avatar_id,
        avatar_url
      )
    `)
    .eq('current_borrower_id', user.id)
    .eq('status', 'borrowed')
    .order('due_date', { ascending: true })
  
  if (borrowedError) {
    console.error('Error fetching borrowed books:', borrowedError)
  }

  // Get queue positions for books user is waiting for
  const { data: queueEntries } = await supabase
    .from('book_queue')
    .select(`
      *,
      book:book_id (
        *,
        owner:owner_id (
          id,
          full_name,
          avatar_type,
          avatar_id,
          avatar_url
        )
      )
    `)
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  const borrowedCount = borrowedBooks?.length || 0
  const queueCount = queueEntries?.length || 0
  const incomingCount = pendingHandoffsIncoming?.length || 0
  const outgoingCount = pendingHandoffsOutgoing?.length || 0

  // Group handoffs by person for batch UI
  const incomingGroups = groupHandoffsByPerson(pendingHandoffsIncoming || [], false)
  const outgoingGroups = groupHandoffsByPerson(pendingHandoffsOutgoing || [], true)

  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  const getDaysBorrowed = (borrowedAt: string | null) => {
    if (!borrowedAt) return null
    return Math.floor((Date.now() - new Date(borrowedAt).getTime()) / (1000 * 60 * 60 * 24))
  }

  const isEmpty = borrowedCount === 0 && queueCount === 0 && incomingCount === 0 && outgoingCount === 0

  return (
    <div className="min-h-screen -mx-4 -my-6 px-4 py-6 bg-[#121212]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Shelf</h1>
        <p className="text-gray-400 mt-1">
          Track your books and handoffs
        </p>
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <span className="text-5xl">📚</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Your shelf is empty</h2>
          <p className="text-gray-400 text-center mb-6 max-w-sm">
            You're not borrowing any books right now. Visit a circle to discover and borrow books from friends!
          </p>
          <Link 
            href="/circles" 
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
          >
            Browse Circles
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Incoming Books Section */}
          {incomingCount > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">
                  Incoming Books
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full">
                  {incomingCount}
                </span>
              </div>
              
              <div className="space-y-3">
                {Object.entries(incomingGroups).map(([otherPersonId, groupedHandoffs]: [string, any[]]) => {
                  // Show batch UI if 2+ books from same person
                  if (groupedHandoffs.length >= 2) {
                    return (
                      <div key={otherPersonId} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                        <BatchHandoffGroup
                          handoffs={groupedHandoffs}
                          userId={user.id}
                          isGiver={false}
                        />
                      </div>
                    )
                  }
                  
                  // Single book card
                  const handoff = groupedHandoffs[0]
                  const contact = getContactInfo(handoff.giver)
                  
                  return (
                    <div
                      key={handoff.id}
                      className="bg-gray-900 rounded-2xl border border-gray-800 p-4"
                    >
                      <div className="flex gap-4">
                        <BookCover
                          coverUrl={handoff.books?.cover_url}
                          title={handoff.books?.title || 'Unknown'}
                          author={handoff.books?.author}
                          isbn={handoff.books?.isbn}
                          className="w-16 h-24 object-cover rounded-lg shadow-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <StatusBadge status="incoming" className="mb-2" />
                          <h3 className="font-semibold text-white truncate">
                            {handoff.books?.title}
                          </h3>
                          <p className="text-sm text-gray-400 truncate">
                            {handoff.books?.author}
                          </p>
                          
                          {/* Person info */}
                          <div className="flex items-center gap-2 mt-3">
                            <Avatar
                              avatarType={handoff.giver?.avatar_type}
                              avatarId={handoff.giver?.avatar_id}
                              avatarUrl={handoff.giver?.avatar_url}
                              userName={handoff.giver?.full_name || 'Unknown'}
                              userId={handoff.giver?.id || ''}
                              size="sm"
                            />
                            <span className="text-sm text-gray-300">
                              From {handoff.giver?.full_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action area */}
                      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                        {contact.value && (
                          <a 
                            href={contact.type === 'phone' ? `sms:${contact.value.replace(/\D/g, '')}` : `mailto:${contact.value}`}
                            className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                          >
                            {contact.type === 'phone' ? '📱' : '📧'} Contact
                          </a>
                        )}
                        <Link
                          href={`/handoff/${handoff.id}`}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors ml-auto"
                        >
                          Confirm Pickup
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Pending Handoffs Section */}
          {outgoingCount > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">
                  Pending Handoffs
                </h2>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-full">
                  {outgoingCount}
                </span>
              </div>
              
              <div className="space-y-3">
                {Object.entries(outgoingGroups).map(([otherPersonId, groupedHandoffs]: [string, any[]]) => {
                  // Show batch UI if 2+ books to same person
                  if (groupedHandoffs.length >= 2) {
                    return (
                      <div key={otherPersonId} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                        <BatchHandoffGroup
                          handoffs={groupedHandoffs}
                          userId={user.id}
                          isGiver={true}
                        />
                      </div>
                    )
                  }
                  
                  // Single book card
                  const handoff = groupedHandoffs[0]
                  return (
                    <Link
                      key={handoff.id}
                      href={`/handoff/${handoff.id}`}
                      className="block bg-gray-900 rounded-2xl border border-gray-800 p-4 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex gap-4">
                        <BookCover
                          coverUrl={handoff.books?.cover_url}
                          title={handoff.books?.title || 'Unknown'}
                          author={handoff.books?.author}
                          isbn={handoff.books?.isbn}
                          className="w-16 h-24 object-cover rounded-lg shadow-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <StatusBadge status="pending" className="mb-2" />
                          <h3 className="font-semibold text-white truncate">
                            {handoff.books?.title}
                          </h3>
                          <p className="text-sm text-gray-400 truncate">
                            {handoff.books?.author}
                          </p>
                          
                          {/* Person info */}
                          <div className="flex items-center gap-2 mt-3">
                            <Avatar
                              avatarType={handoff.receiver?.avatar_type}
                              avatarId={handoff.receiver?.avatar_id}
                              avatarUrl={handoff.receiver?.avatar_url}
                              userName={handoff.receiver?.full_name || 'Unknown'}
                              userId={handoff.receiver?.id || ''}
                              size="sm"
                            />
                            <span className="text-sm text-gray-300">
                              To {handoff.receiver?.full_name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-amber-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Currently Reading Section */}
          {borrowedCount > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">
                  Currently Reading
                </h2>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
                  {borrowedCount}
                </span>
              </div>
              
              <div className="space-y-3">
                {borrowedBooks?.map((book: any) => {
                  const daysRemaining = getDaysRemaining(book.due_date)
                  const daysBorrowed = getDaysBorrowed(book.borrowed_at)
                  const isOverdue = daysRemaining !== null && daysRemaining < 0

                  return (
                    <div 
                      key={book.id} 
                      className={`bg-gray-900 rounded-2xl border p-4 ${
                        isOverdue ? 'border-red-500/50' : 'border-gray-800'
                      }`}
                    >
                      <div className="flex gap-4">
                        <BookCover
                          coverUrl={book.cover_url}
                          title={book.title}
                          author={book.author}
                          isbn={book.isbn}
                          className="w-16 h-24 object-cover rounded-lg shadow-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <StatusBadge status={isOverdue ? 'overdue' : 'reading'} className="mb-2" />
                          <h3 className="font-semibold text-white truncate">{book.title}</h3>
                          {book.author && (
                            <p className="text-sm text-gray-400 truncate">{book.author}</p>
                          )}
                          
                          {/* Owner info */}
                          <div className="flex items-center gap-2 mt-3">
                            <Avatar
                              avatarType={book.owner?.avatar_type}
                              avatarId={book.owner?.avatar_id}
                              avatarUrl={book.owner?.avatar_url}
                              userName={book.owner?.full_name || 'Unknown'}
                              userId={book.owner?.id || ''}
                              size="sm"
                            />
                            <span className="text-sm text-gray-300">
                              From {book.owner?.full_name}
                            </span>
                          </div>
                          
                          {/* Time info */}
                          <div className="mt-3 text-sm">
                            {daysBorrowed !== null && (
                              <p className="text-gray-400">
                                Borrowed {daysBorrowed} day{daysBorrowed !== 1 ? 's' : ''} ago
                              </p>
                            )}
                            {daysRemaining !== null && (
                              <p className={isOverdue ? 'text-red-400 font-medium' : 'text-gray-400'}>
                                {isOverdue 
                                  ? `⚠️ Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}`
                                  : `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action */}
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <DoneReadingButton 
                          bookId={book.id}
                          bookTitle={book.title}
                          status={book.status}
                          ownerName={book.owner?.full_name}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Queue Section */}
          {queueCount > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">
                  In Queue
                </h2>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-sm font-medium rounded-full">
                  {queueCount}
                </span>
              </div>
              
              <div className="space-y-3">
                {queueEntries?.map((entry: any) => {
                  const book = entry.book
                  if (!book) return null

                  return (
                    <div key={entry.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
                      <div className="flex gap-4">
                        <BookCover
                          coverUrl={book.cover_url}
                          title={book.title}
                          author={book.author}
                          isbn={book.isbn}
                          className="w-16 h-24 object-cover rounded-lg shadow-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status="queued" />
                            <span className="text-xs text-purple-400 font-medium">
                              #{entry.position} in line
                            </span>
                          </div>
                          <h3 className="font-semibold text-white truncate">{book.title}</h3>
                          {book.author && (
                            <p className="text-sm text-gray-400 truncate">{book.author}</p>
                          )}
                          
                          {/* Owner info */}
                          <div className="flex items-center gap-2 mt-3">
                            <Avatar
                              avatarType={book.owner?.avatar_type}
                              avatarId={book.owner?.avatar_id}
                              avatarUrl={book.owner?.avatar_url}
                              userName={book.owner?.full_name || 'Unknown'}
                              userId={book.owner?.id || ''}
                              size="sm"
                            />
                            <span className="text-sm text-gray-300">
                              Owned by {book.owner?.full_name}
                            </span>
                          </div>
                          
                          {entry.pass_count > 0 && (
                            <p className="mt-2 text-xs text-amber-400">
                              Passed {entry.pass_count} time{entry.pass_count !== 1 ? 's' : ''}
                              {entry.last_pass_reason && `: ${entry.last_pass_reason}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

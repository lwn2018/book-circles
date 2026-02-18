import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DoneReadingButton from './DoneReadingButton'
import BatchHandoffGroup from '../handoffs/BatchHandoffGroup'
import BookCover from '@/app/components/BookCover'

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

export default async function MyShelfTab() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get pending handoffs where user is the giver (outgoing) - with full data for BatchHandoffGroup
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
        contact_preference_type,
        contact_preference_value
      ),
      receiver:receiver_id (
        id,
        full_name,
        contact_preference_type,
        contact_preference_value
      )
    `)
    .eq('giver_id', user.id)
    .is('both_confirmed_at', null)
    .order('created_at', { ascending: false })

  // Get pending handoffs where user is the receiver (incoming) - with full data for BatchHandoffGroup
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
        contact_preference_type,
        contact_preference_value
      ),
      receiver:receiver_id (
        id,
        full_name,
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
        full_name
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
          full_name
        )
      )
    `)
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  const borrowedCount = borrowedBooks?.length || 0
  const queueCount = queueEntries?.length || 0

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

  return (
    <div>
      {/* Incoming Handoffs - Books coming TO this user */}
      {pendingHandoffsIncoming && pendingHandoffsIncoming.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold mb-3">📥 Incoming Books ({pendingHandoffsIncoming.length})</h2>
          <div className="space-y-3">
            {Object.entries(incomingGroups).map(([otherPersonId, groupedHandoffs]: [string, any[]]) => {
              // Show batch UI if 2+ books from same person
              if (groupedHandoffs.length >= 2) {
                return (
                  <BatchHandoffGroup
                    key={otherPersonId}
                    handoffs={groupedHandoffs}
                    userId={user.id}
                    isGiver={false}
                  />
                )
              }
              
              // Single book - show simple card
              const handoff = groupedHandoffs[0]
              return (
                <Link
                  key={handoff.id}
                  href={`/handoff/${handoff.id}`}
                  className="flex items-center gap-3 p-3 bg-white rounded border border-green-300 hover:border-green-400 transition-colors"
                >
                  <BookCover
                    coverUrl={handoff.books?.cover_url}
                    title={handoff.books?.title || 'Unknown'}
                    author={handoff.books?.author}
                    isbn={handoff.books?.isbn}
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{handoff.books?.title}</p>
                    <p className="text-sm text-gray-600">
                      Pick up from {handoff.giver?.full_name}
                    </p>
                  </div>
                  <div className="text-green-600 font-medium">
                    Confirm →
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Outgoing Handoffs - Books this user is giving away */}
      {pendingHandoffsOutgoing && pendingHandoffsOutgoing.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold mb-3">📤 Pending Handoffs ({pendingHandoffsOutgoing.length})</h2>
          <div className="space-y-3">
            {Object.entries(outgoingGroups).map(([otherPersonId, groupedHandoffs]: [string, any[]]) => {
              // Show batch UI if 2+ books to same person
              if (groupedHandoffs.length >= 2) {
                return (
                  <BatchHandoffGroup
                    key={otherPersonId}
                    handoffs={groupedHandoffs}
                    userId={user.id}
                    isGiver={true}
                  />
                )
              }
              
              // Single book - show simple card
              const handoff = groupedHandoffs[0]
              return (
                <Link
                  key={handoff.id}
                  href={`/handoff/${handoff.id}`}
                  className="flex items-center gap-3 p-3 bg-white rounded border border-yellow-300 hover:border-yellow-400 transition-colors"
                >
                  <BookCover
                    coverUrl={handoff.books?.cover_url}
                    title={handoff.books?.title || 'Unknown'}
                    author={handoff.books?.author}
                    isbn={handoff.books?.isbn}
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{handoff.books?.title}</p>
                    <p className="text-sm text-gray-600">
                      Hand off to {handoff.receiver?.full_name}
                    </p>
                  </div>
                  <div className="text-blue-600 font-medium">
                    Confirm →
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Shelf</h1>
        <p className="text-gray-600 mt-1">
          Books you're reading and waiting for
        </p>
      </div>

      {borrowedCount === 0 && queueCount === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">You're not borrowing any books right now.</p>
          <p className="text-sm text-gray-500">
            Visit a circle to borrow books from your friends!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Currently Borrowed */}
          {borrowedCount > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">📖 Currently Reading ({borrowedCount})</h2>
              <div className="space-y-4">
                {borrowedBooks?.map((book: any) => {
                  const daysRemaining = getDaysRemaining(book.due_date)
                  const daysBorrowed = getDaysBorrowed(book.borrowed_at)
                  const isOverdue = daysRemaining !== null && daysRemaining < 0

                  return (
                    <div 
                      key={book.id} 
                      className={`p-4 rounded-lg border ${
                        isOverdue 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Cover */}
                        <BookCover
                          coverUrl={book.cover_url}
                          title={book.title}
                          author={book.author}
                          isbn={book.isbn}
                          className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
                        />

                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{book.title}</h3>
                          {book.author && (
                            <p className="text-sm text-gray-600">by {book.author}</p>
                          )}
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-gray-600">
                              Owner: {book.owner?.full_name || 'Unknown'}
                            </p>
                            {daysBorrowed !== null && (
                              <p className="text-gray-600">
                                You've had this for {daysBorrowed} day{daysBorrowed !== 1 ? 's' : ''}
                              </p>
                            )}
                            {daysRemaining !== null && (
                              <p className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                {isOverdue 
                                  ? `⚠️ Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}`
                                  : `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                                }
                              </p>
                            )}
                          </div>
                          
                          {/* Done reading button */}
                          <DoneReadingButton 
                            bookId={book.id}
                            bookTitle={book.title}
                            status={book.status}
                            ownerName={book.owner?.full_name}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Queue Positions */}
          {queueCount > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">⏳ In Queue ({queueCount})</h2>
              <div className="space-y-4">
                {queueEntries?.map((entry: any) => {
                  const book = entry.book
                  if (!book) return null

                  return (
                    <div key={entry.id} className="p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex gap-4">
                        {/* Cover */}
                        <BookCover
                          coverUrl={book.cover_url}
                          title={book.title}
                          author={book.author}
                          isbn={book.isbn}
                          className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
                        />

                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{book.title}</h3>
                          {book.author && (
                            <p className="text-sm text-gray-600">by {book.author}</p>
                          )}
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-gray-600">
                              Owner: {book.owner?.full_name || 'Unknown'}
                            </p>
                            <p className="text-purple-600 font-semibold">
                              Position #{entry.position} in queue
                            </p>
                            {entry.pass_count > 0 && (
                              <p className="text-orange-600 text-xs">
                                Passed {entry.pass_count} time{entry.pass_count !== 1 ? 's' : ''}
                                {entry.last_pass_reason && `: ${entry.last_pass_reason}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MyShelfTab() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get books user is currently borrowing
  const { data: borrowedBooks, error: borrowedError } = await supabase
    .from('books')
    .select(`
      id,
      title,
      author,
      isbn,
      cover_url,
      status,
      owner_id,
      current_borrower_id,
      borrowed_at,
      due_date,
      is_gift,
      original_owner_id,
      owner:owner_id (
        full_name
      )
    `)
    .eq('current_borrower_id', user.id)
    .order('due_date', { ascending: true })
  
  if (borrowedError) {
    console.error('Error fetching borrowed books:', borrowedError)
  }
  console.log('Shelf Debug - User ID:', user.id)
  console.log('Shelf Debug - Borrowed books:', JSON.stringify(borrowedBooks, null, 2))
  console.log('Shelf Debug - Count:', borrowedBooks?.length || 0)

  // Get queue positions for books user is waiting for
  const { data: queueEntries } = await supabase
    .from('book_queue')
    .select(`
      id,
      book_id,
      user_id,
      position,
      pass_count,
      last_pass_reason,
      created_at,
      book:book_id (
        id,
        title,
        author,
        cover_url,
        status,
        current_borrower_id,
        owner_id,
        owner:owner_id (
          full_name
        )
      )
    `)
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  const borrowedCount = borrowedBooks?.length || 0
  const queueCount = queueEntries?.length || 0

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
                        {book.cover_url ? (
                          <img 
                            src={book.cover_url} 
                            alt={book.title}
                            className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">📚</span>
                          </div>
                        )}

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
                        {book.cover_url ? (
                          <img 
                            src={book.cover_url} 
                            alt={book.title}
                            className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">📚</span>
                          </div>
                        )}

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

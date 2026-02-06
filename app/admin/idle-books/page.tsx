import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function IdleBooksPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  // Get books that are available and older than 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: availableBooks } = await supabase
    .from('books')
    .select(`
      id,
      title,
      author,
      isbn,
      created_at,
      owner_id,
      circle_id
    `)
    .eq('status', 'available')
    .lt('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  // Get owner and circle details separately
  const ownerIds = availableBooks?.map(b => b.owner_id).filter(Boolean) || []
  const circleIds = availableBooks?.map(b => b.circle_id).filter(Boolean) || []

  const { data: owners } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ownerIds)

  const { data: circles } = await supabase
    .from('circles')
    .select('id, name')
    .in('id', circleIds)

  // Map owners and circles back to books
  const ownersMap = new Map(owners?.map(o => [o.id, o]) || [])
  const circlesMap = new Map(circles?.map(c => [c.id, c]) || [])

  const booksWithDetails = availableBooks?.map(book => ({
    ...book,
    owner: ownersMap.get(book.owner_id) || null,
    circle: circlesMap.get(book.circle_id) || null
  }))

  if (!booksWithDetails || booksWithDetails.length === 0) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/admin" className="text-blue-600 hover:underline">
              ← Back to Admin Dashboard
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-8">Idle Books</h1>

          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-gray-600">No idle books found! All books added in the past 30+ days have been borrowed.</p>
          </div>
        </div>
      </div>
    )
  }

  // Check which books have never been borrowed via analytics
  const bookIds = booksWithDetails.map(b => b.id)
  
  const { data: borrowEvents } = await supabase
    .from('analytics_events')
    .select('event_data')
    .eq('event_type', 'book_borrowed')

  const borrowedBookIds = new Set(
    borrowEvents?.map((e: any) => e.event_data?.bookId).filter(Boolean) || []
  )

  // Filter to books that have never been borrowed
  const neverBorrowedBooks = booksWithDetails.filter(book => !borrowedBookIds.has(book.id))

  // Calculate idle days
  const booksWithIdleDays = neverBorrowedBooks.map(book => ({
    ...book,
    idleDays: Math.floor((Date.now() - new Date(book.created_at).getTime()) / (1000 * 60 * 60 * 24))
  }))

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:underline">
            ← Back to Admin Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Idle Books</h1>
          <p className="text-gray-600">
            Books that have been available for 30+ days but never borrowed
          </p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Idle Books</p>
              <p className="text-3xl font-bold">{booksWithIdleDays.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Longest Idle</p>
              <p className="text-3xl font-bold">
                {Math.max(...booksWithIdleDays.map(b => b.idleDays), 0)}
                <span className="text-lg ml-1">days</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Idle Time</p>
              <p className="text-3xl font-bold">
                {booksWithIdleDays.length > 0 
                  ? Math.round(booksWithIdleDays.reduce((sum, b) => sum + b.idleDays, 0) / booksWithIdleDays.length)
                  : 0}
                <span className="text-lg ml-1">days</span>
              </p>
            </div>
          </div>
        </div>

        {/* Idle Books List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Books Never Borrowed</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left">
                  <th className="px-6 py-3">Book</th>
                  <th className="px-6 py-3">Owner</th>
                  <th className="px-6 py-3">Circle</th>
                  <th className="px-6 py-3">Added</th>
                  <th className="px-6 py-3">Idle Days</th>
                </tr>
              </thead>
              <tbody>
                {booksWithIdleDays.map((book, idx) => (
                  <tr key={book.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{book.title}</p>
                        {book.author && <p className="text-gray-600 text-xs">by {book.author}</p>}
                        {book.isbn && <p className="text-gray-400 text-xs mt-1">ISBN: {book.isbn}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{book.owner?.full_name}</p>
                      <p className="text-gray-500 text-xs">{book.owner?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{book.circle?.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(book.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        book.idleDays > 90 
                          ? 'bg-red-100 text-red-700'
                          : book.idleDays > 60
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {book.idleDays} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

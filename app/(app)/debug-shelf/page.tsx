import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DebugShelfPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Try to get ALL books (no RLS filtering)
  const adminClient = createServerSupabaseClient()
  
  // Query 1: Books where user is borrower (with RLS)
  const { data: borrowedBooks, error: borrowedError } = await supabase
    .from('books')
    .select('*')
    .eq('current_borrower_id', user.id)
  
  // Query 2: Check if there are ANY books with this user as borrower (raw count)
  const { count, error: countError } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })
    .eq('current_borrower_id', user.id)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Shelf Debug Info</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Current User ID:</h2>
          <code className="text-sm">{user.id}</code>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Query with RLS (current_borrower_id = user.id):</h2>
          {borrowedError ? (
            <div className="text-red-600">Error: {JSON.stringify(borrowedError, null, 2)}</div>
          ) : (
            <div>
              <p>Found: {borrowedBooks?.length || 0} books</p>
              <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(borrowedBooks, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Count Query:</h2>
          {countError ? (
            <div className="text-red-600">Error: {JSON.stringify(countError, null, 2)}</div>
          ) : (
            <div>Count: {count}</div>
          )}
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-bold mb-2">Instructions:</h2>
          <ol className="list-decimal ml-4 space-y-1 text-sm">
            <li>If count is 0: The book's current_borrower_id might not be set correctly</li>
            <li>If count &gt; 0 but borrowedBooks is empty: RLS is still blocking the query</li>
            <li>Check the Vercel logs for the "Shelf Debug" console.logs</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

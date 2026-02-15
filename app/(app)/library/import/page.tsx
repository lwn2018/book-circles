import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GoodreadsImporter from './GoodreadsImporter'

export default async function ImportBooks() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user's circles
  const { data: userCircles } = await supabase
    .from('circle_members')
    .select('circle_id, circles(id, name)')
    .eq('user_id', user.id)

  const circles = userCircles?.map(m => m.circles) || []

  return (
    <div className="p-4 sm:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <Link href="/library" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Library
        </Link>

        <h1 className="text-3xl font-bold mb-2">Import from Goodreads</h1>
        <p className="text-gray-600 mb-8">
          Upload your Goodreads library export and choose which circles to share your books with.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">How to export from Goodreads:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener" className="underline">Goodreads Import/Export</a></li>
            <li>Click "Export Library"</li>
            <li>Wait for the CSV file to download</li>
            <li>Upload it below!</li>
          </ol>
        </div>

        <GoodreadsImporter userId={user.id} userCircles={circles as any} />
      </div>
    </div>
  )
}

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GoodreadsImporter from './GoodreadsImporter'

export default async function ImportBooks() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  const { data: userCircles } = await supabase
    .from('circle_members')
    .select('circle_id, circles(id, name)')
    .eq('user_id', user.id)

  const circles = userCircles?.map(m => m.circles) || []

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="text-[#9CA3AF] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Import from Goodreads
        </h1>
      </div>

      <p className="text-[#9CA3AF] mb-6">
        Upload your Goodreads library and choose which books to add to your circles.
      </p>

      {/* Instructions */}
      <div className="bg-[#1E293B] rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-white mb-3">How to export from Goodreads:</h3>
        <ol className="text-sm text-[#9CA3AF] space-y-2">
          <li className="flex gap-2">
            <span className="text-[#55B2DE]">1.</span>
            <span>Go to <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener" className="text-[#55B2DE] hover:underline">Goodreads Import/Export</a></span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#55B2DE]">2.</span>
            <span>Click "Export Library"</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#55B2DE]">3.</span>
            <span>Wait for the CSV file to download</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#55B2DE]">4.</span>
            <span>Upload it below!</span>
          </li>
        </ol>
      </div>

      <GoodreadsImporter userId={user.id} userCircles={circles as any} />
    </div>
  )
}

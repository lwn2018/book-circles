import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NotificationsList from './NotificationsList'

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-6">
      {/* Back link */}
      <div className="mb-6">
        <Link href="/circles" className="inline-flex items-center gap-2 text-[#55B2DE] hover:text-[#6BC4EC] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Circles</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 
          className="text-2xl font-bold text-white mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Notifications
        </h1>
        <p className="text-[#9CA3AF]" style={{ fontFamily: 'var(--font-figtree)' }}>
          Stay updated on your books, circles, and invites
        </p>
      </div>

      {/* Notifications Card */}
      <div className="bg-[#1E293B] rounded-xl overflow-hidden">
        <NotificationsList />
      </div>
    </div>
  )
}

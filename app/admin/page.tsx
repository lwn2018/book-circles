import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdToggle from './AdToggle'

export default async function AdminPage() {
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

  // Get analytics stats
  const { data: totalUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  const { data: totalBooks } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })

  const { data: totalCircles } = await supabase
    .from('circles')
    .select('id', { count: 'exact', head: true })

  const { data: booksOnLoan } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'borrowed')

  // DAU, WAU, MAU
  const { data: dauData } = await supabase.rpc('get_dau')
  const { data: wauData } = await supabase.rpc('get_wau')
  const { data: mauData } = await supabase.rpc('get_mau')

  const dau = dauData || 0
  const wau = wauData || 0
  const mau = mauData || 0
  const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0

  // Books added this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { data: booksAddedWeek } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString())

  // Active circles (had activity in last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: activeCircles } = await supabase
    .from('books')
    .select('circle_id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Affiliate link clicks (last 30 days)
  const { data: affiliateClicks } = await supabase
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'affiliate_link_clicked')
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get ad settings
  const { data: adSettings } = await supabase
    .from('admin_settings')
    .select('*')
    .eq('key', 'ads_enabled')
    .single()

  const adsEnabled = adSettings?.value === true

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to App
          </Link>
        </div>

        {/* Ad Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Ad Controls</h2>
          <AdToggle initialEnabled={adsEnabled} />
        </div>

        {/* User Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Users</h3>
            <p className="text-3xl font-bold">{totalUsers?.count || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">DAU</h3>
            <p className="text-3xl font-bold">{dau}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">WAU</h3>
            <p className="text-3xl font-bold">{wau}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">MAU</h3>
            <p className="text-3xl font-bold">{mau}</p>
          </div>
        </div>

        {/* Engagement */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Stickiness (DAU/MAU)</h3>
            <p className="text-3xl font-bold">{stickiness}%</p>
            <p className="text-xs text-gray-500 mt-1">Target: 40%+</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Books Added (7d)</h3>
            <p className="text-3xl font-bold">{booksAddedWeek?.count || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Active Circles (30d)</h3>
            <p className="text-3xl font-bold">{activeCircles?.count || 0}</p>
          </div>
        </div>

        {/* Book Metrics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Books</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Books</p>
              <p className="text-2xl font-bold">{totalBooks?.count || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Currently Borrowed</p>
              <p className="text-2xl font-bold">{booksOnLoan?.count || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold">
                {(totalBooks?.count || 0) - (booksOnLoan?.count || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Circles */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Circles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Circles</p>
              <p className="text-2xl font-bold">{totalCircles?.count || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active (30d)</p>
              <p className="text-2xl font-bold">{activeCircles?.count || 0}</p>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Signals</h2>
          <div>
            <p className="text-sm text-gray-600">Affiliate Clicks (30d)</p>
            <p className="text-2xl font-bold">{affiliateClicks?.count || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

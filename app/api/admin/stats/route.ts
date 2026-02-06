import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get date range from query params
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const endDate = searchParams.get('end') || new Date().toISOString()

  // Get analytics stats
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  const { count: totalBooks } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })

  const { count: totalCircles } = await supabase
    .from('circles')
    .select('id', { count: 'exact', head: true })

  const { count: booksOnLoan } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'borrowed')

  // DAU, WAU, MAU (always current)
  const { data: dauData } = await supabase.rpc('get_dau')
  const { data: wauData } = await supabase.rpc('get_wau')
  const { data: mauData } = await supabase.rpc('get_mau')

  const dau = dauData || 0
  const wau = wauData || 0
  const mau = mauData || 0
  const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0

  // Books added in date range
  const { count: booksAddedInRange } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Active circles in date range
  const { count: activeCircles } = await supabase
    .from('books')
    .select('circle_id', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Affiliate link clicks in date range
  const { count: affiliateClicks } = await supabase
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'affiliate_link_clicked')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Users created in date range
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Books borrowed in date range
  const { count: booksBorrowedInRange } = await supabase
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'book_borrowed')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  return NextResponse.json({
    totalUsers,
    totalBooks,
    totalCircles,
    booksOnLoan,
    dau,
    wau,
    mau,
    stickiness,
    booksAddedInRange,
    activeCircles,
    affiliateClicks,
    newUsers,
    booksBorrowedInRange,
    dateRange: {
      start: startDate,
      end: endDate
    }
  })
}

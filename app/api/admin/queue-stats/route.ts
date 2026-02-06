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

  try {
    // Total queue entries
    const { count: totalQueueEntries } = await supabase
      .from('book_queue')
      .select('*', { count: 'exact', head: true })

    // Active queue entries (books currently borrowed with queue)
    const { data: activeQueues } = await supabase
      .from('books')
      .select(`
        id,
        status,
        book_queue:book_queue(count)
      `)
      .eq('status', 'borrowed')

    const booksWithQueues = activeQueues?.filter(b => b.book_queue && b.book_queue.length > 0).length || 0

    // Pass statistics from passes table
    const { data: passesData } = await supabase
      .from('passes')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const totalPasses = passesData?.length || 0
    const passReasons = passesData?.reduce((acc: Record<string, number>, pass) => {
      const reason = pass.reason || 'No reason given'
      acc[reason] = (acc[reason] || 0) + 1
      return acc
    }, {})

    // Calculate average wait time (approximate from queue positions)
    const { data: queueData } = await supabase
      .from('book_queue')
      .select(`
        position,
        created_at,
        book:books(status, borrowed_at)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    let totalWaitDays = 0
    let waitCount = 0

    queueData?.forEach((entry: any) => {
      if (entry.position > 1 && entry.book?.borrowed_at) {
        const borrowedDate = new Date(entry.book.borrowed_at)
        const queueDate = new Date(entry.created_at)
        const daysDiff = Math.floor((borrowedDate.getTime() - queueDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff > 0 && daysDiff < 365) { // Reasonable range
          totalWaitDays += daysDiff
          waitCount++
        }
      }
    })

    const averageWaitDays = waitCount > 0 ? Math.round(totalWaitDays / waitCount) : 0

    // Books passed on vs accepted (from passes table + successful loans)
    const { data: loansInRange } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'book_borrowed')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const acceptCount = loansInRange || 0
    const passRate = totalPasses + acceptCount > 0 
      ? Math.round((totalPasses / (totalPasses + acceptCount)) * 100) 
      : 0

    return NextResponse.json({
      totalQueueEntries,
      booksWithQueues,
      totalPasses,
      passRate,
      passReasons,
      averageWaitDays,
      acceptCount,
      dateRange: {
        start: startDate,
        end: endDate
      }
    })
  } catch (error: any) {
    console.error('Failed to fetch queue stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch queue stats' },
      { status: 500 }
    )
  }
}

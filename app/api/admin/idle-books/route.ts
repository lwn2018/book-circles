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

  try {
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
        owner:owner_id(full_name, email),
        circles:circle_id(name)
      `)
      .eq('status', 'available')
      .lt('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    if (!availableBooks || availableBooks.length === 0) {
      return NextResponse.json({
        idleBooks: [],
        count: 0
      })
    }

    // Check which books have never been borrowed
    // We'll check analytics_events for book_borrowed events
    const bookIds = availableBooks.map(b => b.id)
    
    const { data: borrowEvents } = await supabase
      .from('analytics_events')
      .select('event_data')
      .eq('event_type', 'book_borrowed')
      .in('event_data->>bookId', bookIds)

    const borrowedBookIds = new Set(
      borrowEvents?.map((e: any) => e.event_data?.bookId).filter(Boolean) || []
    )

    // Filter to books that have never been borrowed
    const neverBorrowedBooks = availableBooks.filter(book => !borrowedBookIds.has(book.id))

    // Calculate idle days
    const booksWithIdleDays = neverBorrowedBooks.map(book => ({
      ...book,
      idleDays: Math.floor((Date.now() - new Date(book.created_at).getTime()) / (1000 * 60 * 60 * 24))
    }))

    return NextResponse.json({
      idleBooks: booksWithIdleDays,
      count: booksWithIdleDays.length
    })
  } catch (error: any) {
    console.error('Failed to fetch idle books:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch idle books' },
      { status: 500 }
    )
  }
}

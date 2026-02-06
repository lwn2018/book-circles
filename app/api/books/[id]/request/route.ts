import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// Get book details + queue info for request confirmation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: bookId } = await params

  try {
    // Get book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        status,
        owner_id,
        current_borrower_id,
        profiles!books_owner_id_fkey (
          id,
          full_name
        )
      `)
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Get current queue
    const { data: queue } = await supabase
      .from('book_queue')
      .select('user_id, position')
      .eq('book_id', bookId)
      .order('position', { ascending: true })

    // Check if user is already in queue
    const alreadyInQueue = queue?.some(q => q.user_id === user.id) || false

    // Get current holder name if borrowed
    let currentHolderName = null
    if (book.current_borrower_id) {
      const { data: holder } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', book.current_borrower_id)
        .single()
      
      currentHolderName = holder?.full_name || 'Someone'
    }

    const queueLength = queue?.length || 0
    const isAvailable = book.status === 'available'
    const ownerName = (book.profiles as any)?.full_name || 'Owner'

    return NextResponse.json({
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        status: book.status,
        ownerName,
        ownerId: book.owner_id
      },
      queue: {
        length: queueLength,
        yourPosition: queueLength + 1,
        currentHolder: currentHolderName,
        isAvailable
      },
      alreadyInQueue
    })
  } catch (error: any) {
    console.error('Failed to fetch book request info:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch book info' },
      { status: 500 }
    )
  }
}

// Join the queue for a book
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: bookId } = await params

  try {
    // Get book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, owner_id, status')
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Check if user owns this book
    if (book.owner_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot request your own book' },
        { status: 400 }
      )
    }

    // Check if already in queue
    const { data: existing } = await supabase
      .from('book_queue')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'You are already in this queue' },
        { status: 400 }
      )
    }

    // Get next position
    const { data: queue } = await supabase
      .from('book_queue')
      .select('position')
      .eq('book_id', bookId)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = queue && queue.length > 0 ? queue[0].position + 1 : 1

    // Add to queue
    const { error: insertError } = await supabase
      .from('book_queue')
      .insert({
        book_id: bookId,
        user_id: user.id,
        position: nextPosition,
        pass_count: 0,
        joined_queue_at: new Date().toISOString()
      })

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    // Get requester's name for notification
    const { data: requester } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const requesterName = requester?.full_name || 'Someone'

    // Create notification for owner
    const notificationMessage = nextPosition === 1 && book.status === 'available'
      ? `${requesterName} wants to borrow ${book.title}`
      : `${requesterName} requested ${book.title} — they're #${nextPosition} in the queue`

    await supabase
      .from('notifications')
      .insert({
        user_id: book.owner_id,
        type: 'book_requested',
        book_id: bookId,
        sender_id: user.id,
        message: notificationMessage,
        read: false
      })

    return NextResponse.json({
      success: true,
      position: nextPosition,
      message: `You're now #${nextPosition} in the queue`
    })
  } catch (error: any) {
    console.error('Failed to join queue:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to join queue' },
      { status: 500 }
    )
  }
}

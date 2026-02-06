import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Handle "Still reading" action from soft reminder notification
 * Resets the 2-week reminder timer
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { book_id, notification_id } = body

    if (!book_id) {
      return NextResponse.json(
        { error: 'Missing book_id' },
        { status: 400 }
      )
    }

    // Verify user is the current borrower
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, current_borrower_id, status')
      .eq('id', book_id)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    if (book.current_borrower_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not the current borrower of this book' },
        { status: 403 }
      )
    }

    if (book.status !== 'borrowed') {
      return NextResponse.json(
        { error: 'Book is not currently borrowed' },
        { status: 400 }
      )
    }

    // Reset the soft reminder timer
    const { error: updateError } = await supabase
      .from('books')
      .update({ last_soft_reminder_at: new Date().toISOString() })
      .eq('id', book_id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Mark notification as read if provided
    if (notification_id) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification_id)
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'No rush — enjoy!',
      book: {
        id: book.id,
        title: book.title
      }
    })
  } catch (error: any) {
    console.error('Still reading action error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process action' },
      { status: 500 }
    )
  }
}

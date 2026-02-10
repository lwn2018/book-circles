import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Check if user is currently borrowing any books
    const { data: borrowedBooks, error: borrowError } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        status,
        owner:owner_id (full_name)
      `)
      .eq('current_borrower_id', user.id)
      .in('status', ['borrowed', 'in_transit'])

    if (borrowError) throw borrowError

    // 2. Check if user has books currently lent out
    const { data: lentBooks, error: lentError } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        status,
        current_borrower:current_borrower_id (full_name)
      `)
      .eq('owner_id', user.id)
      .in('status', ['borrowed', 'in_transit'])

    if (lentError) throw lentError

    // 3. Check for pending handoff confirmations
    const { data: pendingHandoffs, error: handoffError } = await supabase
      .from('handoff_confirmations')
      .select(`
        id,
        book:books (
          id,
          title
        ),
        giver_id,
        receiver_id
      `)
      .or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .is('both_confirmed_at', null)

    if (handoffError) throw handoffError

    const hasActiveBorrows = (borrowedBooks?.length || 0) > 0
    const hasLentBooks = (lentBooks?.length || 0) > 0
    const hasPendingHandoffs = (pendingHandoffs?.length || 0) > 0

    const canDelete = !hasActiveBorrows && !hasLentBooks && !hasPendingHandoffs

    return NextResponse.json({
      can_delete: canDelete,
      active_borrows: {
        borrowing: borrowedBooks || [],
        lent_out: lentBooks || [],
        pending_handoffs: pendingHandoffs || []
      },
      blockers: {
        has_active_borrows: hasActiveBorrows,
        has_lent_books: hasLentBooks,
        has_pending_handoffs: hasPendingHandoffs
      }
    })

  } catch (error: any) {
    console.error('Check deletion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check account status' },
      { status: 500 }
    )
  }
}

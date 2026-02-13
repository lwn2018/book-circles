import { createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const adminClient = createServiceRoleClient()

  // Get book details
  const { data: book, error } = await adminClient
    .from('books')
    .select(`
      *,
      owner:owner_id (
        id,
        full_name
      ),
      current_holder:current_borrower_id (
        id,
        full_name
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get active handoffs
  const { data: handoffs } = await adminClient
    .from('handoff_confirmations')
    .select(`
      *,
      giver:giver_id (id, full_name),
      receiver:receiver_id (id, full_name)
    `)
    .eq('book_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    book,
    handoffs,
    debug: {
      status: book.status,
      owner_id: book.owner_id,
      current_borrower_id: book.current_borrower_id,
      borrowed_at: book.borrowed_at,
      due_date: book.due_date
    }
  })
}

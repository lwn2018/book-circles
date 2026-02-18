import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createServiceRoleClient()

  try {
    // Find all handoffs where both parties confirmed but book is still in_transit
    const { data: stuckHandoffs, error: fetchError } = await adminClient
      .from('handoff_confirmations')
      .select(`
        id,
        book_id,
        giver_id,
        receiver_id,
        giver_confirmed_at,
        receiver_confirmed_at,
        both_confirmed_at,
        books:book_id (
          id,
          title,
          status,
          gift_on_borrow
        )
      `)
      .not('giver_confirmed_at', 'is', null)
      .not('receiver_confirmed_at', 'is', null)

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const results: any[] = []

    for (const handoff of stuckHandoffs || []) {
      const book = handoff.books as any
      
      // Skip if book is already in a good state
      if (!book || book.status === 'borrowed' || book.status === 'available') {
        continue
      }

      console.log(`[fix-stuck] Found stuck book: ${book.title} (status: ${book.status})`)

      // Set both_confirmed_at if not set
      if (!handoff.both_confirmed_at) {
        await adminClient
          .from('handoff_confirmations')
          .update({ both_confirmed_at: new Date().toISOString() })
          .eq('id', handoff.id)
      }

      // Check if it's a gift book
      if (book.gift_on_borrow) {
        // Transfer ownership to receiver
        const { error: updateError } = await adminClient
          .from('books')
          .update({
            owner_id: handoff.receiver_id,
            current_borrower_id: null,
            status: 'available',
            due_date: null
          })
          .eq('id', handoff.book_id)

        results.push({
          bookId: handoff.book_id,
          title: book.title,
          action: 'gift_transferred',
          newOwner: handoff.receiver_id,
          error: updateError?.message
        })
      } else {
        // Regular borrow - set status to borrowed
        const { error: updateError } = await adminClient
          .from('books')
          .update({ status: 'borrowed' })
          .eq('id', handoff.book_id)

        results.push({
          bookId: handoff.book_id,
          title: book.title,
          action: 'status_fixed',
          newStatus: 'borrowed',
          error: updateError?.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      fixed: results.length,
      details: results
    })

  } catch (error: any) {
    console.error('Fix error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

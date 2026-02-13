import { createServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  const adminClient = createServiceRoleClient()

  // Find all books where owner_id === current_borrower_id (self-borrows)
  const { data: selfBorrowedBooks, error } = await adminClient
    .from('books')
    .select(`
      id,
      title,
      author,
      status,
      owner_id,
      current_borrower_id,
      borrowed_at,
      due_date
    `)
    .not('current_borrower_id', 'is', null)
    .eq('owner_id', 'current_borrower_id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const fixes: any[] = []

  // Fix each self-borrowed book
  for (const book of selfBorrowedBooks || []) {
    const { error: updateError } = await adminClient
      .from('books')
      .update({
        status: 'available',
        current_borrower_id: null,
        borrowed_at: null,
        due_date: null
      })
      .eq('id', book.id)

    fixes.push({
      bookId: book.id,
      title: book.title,
      author: book.author,
      oldStatus: book.status,
      success: !updateError,
      error: updateError?.message
    })
  }

  return NextResponse.json({
    message: `Found and fixed ${selfBorrowedBooks?.length || 0} self-borrowed books`,
    fixes
  })
}

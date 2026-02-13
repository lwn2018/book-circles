import { createServiceRoleClient } from '../lib/supabase-server'

async function debug8thHabit() {
  const adminClient = createServiceRoleClient()

  // Find The 8th Habit
  const { data: book, error } = await adminClient
    .from('books')
    .select(`
      *,
      owner:owner_id (
        id,
        full_name,
        email
      ),
      current_holder:current_borrower_id (
        id,
        full_name,
        email
      )
    `)
    .eq('title', 'The 8th Habit')
    .eq('author', 'Stephen Covey')
    .single()

  if (error) {
    console.error('Error finding book:', error)
    return
  }

  console.log('\n=== THE 8TH HABIT DEBUG ===')
  console.log('Book ID:', book.id)
  console.log('Status:', book.status)
  console.log('Owner ID:', book.owner_id)
  console.log('Owner Name:', book.owner?.full_name)
  console.log('Owner Email:', book.owner?.email)
  console.log('Current Borrower ID:', book.current_borrower_id)
  console.log('Current Holder Name:', book.current_holder?.full_name)
  console.log('Borrowed At:', book.borrowed_at)
  console.log('Due Date:', book.due_date)
  
  // Check if owner === borrower
  if (book.owner_id === book.current_borrower_id) {
    console.log('\n⚠️  BUG CONFIRMED: Owner is set as their own borrower!')
  }

  // Get recent handoffs
  const { data: handoffs } = await adminClient
    .from('handoff_confirmations')
    .select(`
      *,
      giver:giver_id (full_name),
      receiver:receiver_id (full_name)
    `)
    .eq('book_id', book.id)
    .order('created_at', { ascending: false })
    .limit(3)

  console.log('\n=== RECENT HANDOFFS ===')
  handoffs?.forEach((h, i) => {
    console.log(`\nHandoff ${i + 1}:`)
    console.log('  ID:', h.id)
    console.log('  Giver:', h.giver?.full_name)
    console.log('  Receiver:', h.receiver?.full_name)
    console.log('  Giver Confirmed:', h.giver_confirmed_at ? 'Yes' : 'No')
    console.log('  Receiver Confirmed:', h.receiver_confirmed_at ? 'Yes' : 'No')
    console.log('  Both Confirmed:', h.both_confirmed_at ? 'Yes' : 'No')
    console.log('  Created:', h.created_at)
  })
}

debug8thHabit()

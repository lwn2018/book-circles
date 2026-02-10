import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetDatabase() {
  console.log('🔄 Starting database reset...\n')

  try {
    // 1. Return all books to their owners
    console.log('1️⃣ Returning all books to owners...')
    const { data: books, error: booksError } = await supabase
      .from('books')
      .update({
        status: 'available',
        current_borrower_id: null,
        due_date: null
      })
      .neq('status', 'available') // Only update books that aren't already available
      .select()

    if (booksError) {
      console.error('   ❌ Error updating books:', booksError)
      throw booksError
    }
    console.log(`   ✅ Updated ${books?.length || 0} books to available status`)

    // 2. Clear all book queues
    console.log('\n2️⃣ Clearing all book queues...')
    const { count: queueCount, error: queueError } = await supabase
      .from('book_queue')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (queueError) {
      console.error('   ❌ Error clearing queues:', queueError)
      throw queueError
    }
    console.log(`   ✅ Cleared ${queueCount || 0} queue entries`)

    // 3. Clear all handoff confirmations
    console.log('\n3️⃣ Clearing all handoff confirmations...')
    const { count: handoffCount, error: handoffError } = await supabase
      .from('handoff_confirmations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (handoffError) {
      console.error('   ❌ Error clearing handoffs:', handoffError)
      throw handoffError
    }
    console.log(`   ✅ Cleared ${handoffCount || 0} handoff confirmations`)

    // 4. Clear all notifications (to avoid orphaned references)
    console.log('\n4️⃣ Clearing all notifications...')
    const { count: notifCount, error: notifError } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (notifError) {
      console.error('   ❌ Error clearing notifications:', notifError)
      throw notifError
    }
    console.log(`   ✅ Cleared ${notifCount || 0} notifications`)

    // 5. Verify the reset
    console.log('\n5️⃣ Verifying reset...')
    const { count: borrowedCount } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'borrowed')

    const { count: remainingQueues } = await supabase
      .from('book_queue')
      .select('*', { count: 'exact', head: true })

    const { count: remainingHandoffs } = await supabase
      .from('handoff_confirmations')
      .select('*', { count: 'exact', head: true })

    const { count: remainingNotifs } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })

    console.log(`   📚 Borrowed books: ${borrowedCount || 0}`)
    console.log(`   📋 Queue entries: ${remainingQueues || 0}`)
    console.log(`   🤝 Handoff confirmations: ${remainingHandoffs || 0}`)
    console.log(`   🔔 Notifications: ${remainingNotifs || 0}`)

    console.log('\n✅ Database reset complete! All books returned, queues cleared, handoffs cleared.')
    console.log('📝 Note: book_ownership_history preserved (historical records).')

  } catch (error) {
    console.error('\n❌ Reset failed:', error)
    process.exit(1)
  }
}

resetDatabase()

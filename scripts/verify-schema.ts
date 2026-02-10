import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySchema() {
  console.log('Checking database tables...\n')

  // Check for tables
  const tables = ['books', 'book_queue', 'handoff_confirmations', 'book_ownership_history', 'notifications']
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ Table '${table}': NOT FOUND or ERROR`)
        console.log(`   Error: ${error.message}`)
      } else {
        console.log(`✅ Table '${table}': EXISTS (${count} rows)`)
      }
    } catch (e) {
      console.log(`❌ Table '${table}': ERROR - ${e}`)
    }
  }

  console.log('\n--- Current books status ---')
  const { data: books } = await supabase
    .from('books')
    .select('id, title, status, current_borrower_id')
    .limit(5)
  
  console.log(JSON.stringify(books, null, 2))

  console.log('\n--- Current queues ---')
  const { data: queues, count: queueCount } = await supabase
    .from('book_queue')
    .select('*', { count: 'exact' })
    .limit(5)
  
  console.log(`Total queues: ${queueCount}`)
  console.log(JSON.stringify(queues, null, 2))

  console.log('\n--- Current handoff confirmations ---')
  const { data: handoffs, count: handoffCount } = await supabase
    .from('handoff_confirmations')
    .select('*', { count: 'exact' })
    .limit(5)
  
  console.log(`Total handoffs: ${handoffCount}`)
  console.log(JSON.stringify(handoffs, null, 2))
}

verifySchema().catch(console.error)

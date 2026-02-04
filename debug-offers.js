const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://kuwuymdqtkmljwqppvdz.supabase.co',
  'sb_publishable_wFWwWtjbpD6J5oSJhem0Zw_aCheeb5l'
)

async function debug() {
  // Get all books
  const { data: books } = await supabase
    .from('books')
    .select('id, title, status, next_recipient, current_borrower_id, owner_id')
  
  console.log('\n📚 ALL BOOKS:')
  console.log(JSON.stringify(books, null, 2))

  // Get all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
  
  console.log('\n👥 ALL PROFILES:')
  console.log(JSON.stringify(profiles, null, 2))

  // Get all queue entries
  const { data: queue } = await supabase
    .from('book_queue')
    .select('*')
  
  console.log('\n📋 ALL QUEUE ENTRIES:')
  console.log(JSON.stringify(queue, null, 2))

  // Check for test1@yuill.ca specifically
  const test1 = profiles?.find(p => p.email === 'test1@yuill.ca')
  if (test1) {
    console.log('\n🔍 CHECKING FOR test1@yuill.ca (id:', test1.id, ')')
    
    const { data: offeredBooks } = await supabase
      .from('books')
      .select('*')
      .eq('next_recipient', test1.id)
      .eq('status', 'ready_for_next')
    
    console.log('Books offered to test1:', JSON.stringify(offeredBooks, null, 2))
  }
}

debug()

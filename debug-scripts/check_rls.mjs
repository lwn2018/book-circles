import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkRLS() {
  // Query to get RLS policies on books table
  const { data, error } = await supabase
    .rpc('pg_policies', {})
    .eq('tablename', 'books')
  
  if (error) {
    console.log('Error querying policies:', error)
    console.log('\nTrying direct SQL query...')
    
    // Try a simpler query
    const { data: test, error: testError } = await supabase
      .from('books')
      .select('count')
      .limit(1)
    
    console.log('Books accessible via service role:', test, testError)
  } else {
    console.log('RLS Policies on books table:', data)
  }
  
  // Let's also test what each user can actually see
  console.log('\n=== Testing Book Visibility for Each User ===\n')
  
  const users = [
    { email: 'mathieu@yuill.ca', id: '0d069c1d-08a8-44d1-bce4-972455fbc7c7' },
    { email: 'test@yuill.ca', id: '28c56b20-3bf8-4fca-9b2c-ec92e2b70c83' }
  ]
  
  for (const user of users) {
    // Create a client with the user's auth
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // We can't actually auth as the user without their password
    // So let's just query using service role but simulate their query
    
    const alphaCircleId = '0fde346f-1ad0-4e6c-a736-1294a5b008e3'
    
    // Get member IDs
    const { data: members } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', alphaCircleId)
    
    const memberIds = members?.map(m => m.user_id) || []
    
    // Get books (simulating what the page does)
    const { data: allBooks } = await supabase
      .from('books')
      .select('id, title, owner_id')
      .in('owner_id', memberIds)
    
    // Get hidden books
    const { data: hiddenBooks } = await supabase
      .from('book_circle_visibility')
      .select('book_id')
      .eq('circle_id', alphaCircleId)
      .eq('is_visible', false)
    
    const hiddenBookIds = new Set(hiddenBooks?.map(h => h.book_id) || [])
    const visibleBooks = allBooks?.filter(b => !hiddenBookIds.has(b.id)) || []
    
    console.log(`${user.email}: Should see ${visibleBooks.length} books`)
    console.log(`  (Total: ${allBooks?.length}, Hidden: ${hiddenBooks?.length})`)
  }
}

checkRLS().catch(console.error)

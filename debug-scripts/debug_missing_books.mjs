import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debug() {
  console.log('🔍 Checking database state...\n')
  
  // 1. Total books
  const { count: bookCount } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
  console.log(`📚 Total books in DB: ${bookCount}`)
  
  // 2. Total visibility entries
  const { count: visCount } = await supabase
    .from('book_circle_visibility')
    .select('*', { count: 'exact', head: true })
  console.log(`👁️  Total visibility entries: ${visCount}`)
  
  // 3. Get mathieu's user_id
  const { data: users } = await supabase.auth.admin.listUsers()
  const mathieu = users.users.find(u => u.email === 'mathieu@yuill.ca')
  const test = users.users.find(u => u.email === 'test@yuill.ca')
  
  if (!mathieu) {
    console.log('❌ Could not find mathieu@yuill.ca')
    return
  }
  
  console.log(`\n👤 Mathieu user_id: ${mathieu.id}`)
  if (test) console.log(`👤 Test user_id: ${test.id}`)
  
  // 4. Check mathieu's circles
  const { data: circles } = await supabase
    .from('circle_members')
    .select('circle_id, circles(name)')
    .eq('user_id', mathieu.id)
  console.log(`\n⭕ Mathieu's circles:`, circles)
  
  // 5. Check visibility entries for mathieu
  const { data: mathieuVis, count: mathieuVisCount } = await supabase
    .from('book_circle_visibility')
    .select('book_id, circle_id, is_visible', { count: 'exact' })
    .eq('user_id', mathieu.id)
  console.log(`\n👁️  Mathieu's visibility entries: ${mathieuVisCount}`)
  console.log('Sample (first 5):', mathieuVis?.slice(0, 5))
  
  // 6. Try the actual query the app uses
  const { data: visibleBooks, error } = await supabase
    .from('books')
    .select('id, title, status')
    .eq('book_circle_visibility.user_id', mathieu.id)
    .eq('book_circle_visibility.is_visible', true)
    .limit(10)
    
  console.log(`\n📖 Visible books query result:`)
  console.log('Error:', error)
  console.log('Books returned:', visibleBooks?.length || 0)
  if (visibleBooks) console.log('Sample:', visibleBooks.slice(0, 3))
}

debug().catch(console.error)

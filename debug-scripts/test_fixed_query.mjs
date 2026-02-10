import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  console.log('🧪 Testing the fixed RLS logic (simulated)...\n')
  
  // Get mathieu
  const { data: users } = await supabase.auth.admin.listUsers()
  const mathieu = users.users.find(u => u.email === 'mathieu@yuill.ca')
  
  console.log('Testing for user:', mathieu.email, mathieu.id)
  
  // Simulate the fixed policy logic
  // 1. Books owned by mathieu
  const { data: ownedBooks } = await supabase
    .from('books')
    .select('id, title')
    .eq('owner_id', mathieu.id)
    
  console.log(`\n📚 Books owned by mathieu: ${ownedBooks?.length}`)
  
  // 2. Books visible in circles mathieu belongs to
  const { data: visibleBookIds } = await supabase
    .from('book_circle_visibility')
    .select('book_id')
    .eq('is_visible', true)
    .in('circle_id', 
      (await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', mathieu.id)
      ).data?.map(cm => cm.circle_id) || []
    )
    
  console.log(`👁️  Visible book IDs in mathieu's circles: ${visibleBookIds?.length}`)
  
  const allBookIds = new Set([
    ...(ownedBooks?.map(b => b.id) || []),
    ...(visibleBookIds?.map(v => v.book_id) || [])
  ])
  
  console.log(`\n✅ Total books mathieu should see: ${allBookIds.size}`)
  
  // Get those books
  const { data: shouldSeeBooks } = await supabase
    .from('books')
    .select('id, title, author, owner_id')
    .in('id', Array.from(allBookIds))
    
  console.log('\nSample books:')
  shouldSeeBooks?.slice(0, 5).forEach(b => {
    console.log(`  - ${b.title} by ${b.author}`)
  })
}

test().catch(console.error)

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verify() {
  console.log('🧪 Verifying the fix...\n')
  
  // Get mathieu
  const { data: users } = await supabase.auth.admin.listUsers()
  const mathieu = users.users.find(u => u.email === 'mathieu@yuill.ca')
  
  if (!mathieu) {
    console.log('❌ Could not find mathieu@yuill.ca')
    return
  }
  
  console.log('Testing for:', mathieu.email)
  
  // Create a temporary session for mathieu to test RLS
  const { data: session } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'mathieu@yuill.ca'
  })
  
  // Use anon client with mathieu's session
  const testClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  // Try to query books as mathieu would
  const { data: books, error } = await testClient
    .from('books')
    .select('id, title, author')
    .limit(10)
    
  console.log('\n📚 Books query result (with RLS):')
  console.log('Error:', error)
  console.log('Books returned:', books?.length || 0)
  
  if (books && books.length > 0) {
    console.log('\n✅ SUCCESS! Books are visible again')
    console.log('Sample books:')
    books.slice(0, 5).forEach(b => {
      console.log(`  - ${b.title} by ${b.author}`)
    })
  } else if (error) {
    console.log('\n❌ STILL BROKEN:', error.message)
    console.log('Error code:', error.code)
  } else {
    console.log('\n❌ No books returned, but no error either')
  }
}

verify().catch(console.error)

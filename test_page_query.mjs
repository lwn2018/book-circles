import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  // Get mathieu
  const { data: users } = await supabase.auth.admin.listUsers()
  const mathieu = users.users.find(u => u.email === 'mathieu@yuill.ca')
  
  // Get Alpha Circle
  const { data: circle } = await supabase
    .from('circles')
    .select('*')
    .eq('name', 'Alpha Circle')
    .single()
    
  console.log('Circle:', circle.id)
  
  // Get member IDs
  const { data: memberIds } = await supabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', circle.id)
    
  console.log('Members:', memberIds.length)
  
  const ownerIds = memberIds?.map(m => m.user_id) || []
  
  // Get books owned by members (SERVICE ROLE - no RLS)
  const { data: allBooks, error } = await supabase
    .from('books')
    .select('id, title, author, owner_id')
    .in('owner_id', ownerIds)
    
  console.log('\n📚 Books query (service role):')
  console.log('Error:', error)
  console.log('Books found:', allBooks?.length)
  console.log('Sample:', allBooks?.slice(0, 3))
  
  // Now try with RLS as mathieu (using anon key)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  // Set auth
  const { data: session } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'mathieu@yuill.ca'
  })
  
  console.log('\n🔐 Testing with RLS as mathieu...')
  
  // Try direct query as user
  const { data: userBooks, error: userError } = await anonClient
    .from('books')
    .select('id, title, author')
    .in('owner_id', ownerIds)
    
  console.log('Error:', userError)
  console.log('Books returned:', userBooks?.length)
}

test().catch(console.error)

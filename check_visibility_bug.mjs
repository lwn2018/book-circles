import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  // Get all users
  const { data: users } = await supabase.auth.admin.listUsers()
  
  console.log('🔍 Checking visibility entries for all users:\n')
  
  for (const user of users.users) {
    const { count } = await supabase
      .from('book_circle_visibility')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    console.log(`${user.email}: ${count} entries`)
  }
  
  // Check if there ARE any visibility entries at all
  const { data: allVis } = await supabase
    .from('book_circle_visibility')
    .select('user_id, book_id, circle_id, is_visible')
    .limit(10)
    
  console.log('\n📋 Sample visibility entries (first 10):')
  console.log(allVis)
}

check().catch(console.error)

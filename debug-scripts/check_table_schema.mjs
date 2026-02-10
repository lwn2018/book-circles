import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  // Check if table exists and its structure
  const { data, error } = await supabase
    .from('book_circle_visibility')
    .select('*')
    .limit(1)
    
  console.log('Table query error:', error)
  console.log('Table data:', data)
  
  // Check table row count directly
  const { count } = await supabase
    .from('book_circle_visibility')
    .select('*', { count: 'exact', head: true })
    
  console.log('\nRow count:', count)
}

check().catch(console.error)

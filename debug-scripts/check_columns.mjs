import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  // Get full sample row to see all columns
  const { data } = await supabase
    .from('book_circle_visibility')
    .select('*')
    .limit(3)
    
  console.log('📋 Sample rows with ALL columns:')
  console.log(JSON.stringify(data, null, 2))
}

check().catch(console.error)

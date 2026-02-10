import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verify() {
  console.log('🧪 Verifying activity_ledger table...\n')
  
  // Check if table exists and has correct columns
  const { data, error } = await supabase
    .from('activity_ledger')
    .select('*')
    .limit(1)
    
  if (error) {
    console.log('❌ Error:', error.message)
  } else {
    console.log('✅ Table exists and is accessible')
    console.log('Sample structure:', data.length > 0 ? Object.keys(data[0]) : 'empty table')
  }
  
  // Check row count
  const { count } = await supabase
    .from('activity_ledger')
    .select('*', { count: 'exact', head: true })
    
  console.log(`📊 Current rows: ${count || 0}`)
}

verify().catch(console.error)

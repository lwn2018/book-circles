import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  console.log('🔍 Checking current RLS policies on books table...\n')
  
  // Try to get policies via raw SQL
  const queries = [
    `SELECT policyname, cmd, qual::text, with_check::text 
     FROM pg_policies 
     WHERE schemaname = 'public' AND tablename = 'books'`,
  ]
  
  for (const query of queries) {
    console.log('Trying query:', query.substring(0, 60) + '...')
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: query 
    })
    
    if (error) {
      console.log('Error:', error)
    } else {
      console.log('Success! Policies found:')
      console.log(JSON.stringify(data, null, 2))
    }
    console.log()
  }
}

check().catch(console.error)

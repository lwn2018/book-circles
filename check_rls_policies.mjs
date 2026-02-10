import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  // Get RLS policies on books table
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        polname as policy_name,
        polcmd as command,
        qual as using_expression,
        with_check as with_check_expression
      FROM pg_policy
      WHERE polrelid = 'books'::regclass;
    `
  })
  
  if (error) {
    // Try direct query
    const result = await supabase.from('pg_policies').select('*').eq('tablename', 'books')
    console.log(result)
  } else {
    console.log(data)
  }
}

check().catch(console.error)

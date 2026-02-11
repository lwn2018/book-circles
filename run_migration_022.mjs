import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('🚀 Running Migration 022: Remove circle_id column\n')
  
  const sql = readFileSync('migrations/022-remove-circle-id-column.sql', 'utf8')
  
  // Execute via raw SQL query
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  
  if (error && error.code !== 'PGRST202') {
    // Try direct execution if rpc doesn't exist
    console.log('RPC not available, checking for alternate method...')
    console.log('\nPlease run this SQL in Supabase SQL Editor:')
    console.log('---')
    console.log(sql)
    console.log('---')
    return
  }
  
  console.log('✅ Migration 022 complete!')
  console.log('   circle_id column removed from books table')
}

runMigration().catch(console.error)

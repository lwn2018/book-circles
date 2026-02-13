// Quick script to run migration 027
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  const sql = readFileSync(join(process.cwd(), 'migrations/027-fix-rls-for-borrowers.sql'), 'utf-8')
  
  // Remove comments and empty lines
  const cleanSql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim())
    .join('\n')
  
  console.log('Running migration 027...')
  console.log(cleanSql)
  
  const { data, error } = await supabase.rpc('exec_sql', { sql: cleanSql })
  
  if (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
  
  console.log('✅ Migration 027 applied successfully!')
}

runMigration()

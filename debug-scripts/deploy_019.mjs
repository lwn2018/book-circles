import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deploy() {
  console.log('🚀 Deploying Migration 019: Fix Infinite Recursion RLS\n')
  
  const sql = readFileSync('migrations/019-fix-infinite-recursion-rls.sql', 'utf8')
  
  // Split on semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))
  
  for (const statement of statements) {
    console.log('Executing:', statement.substring(0, 80) + '...')
    
    const { error } = await supabase.rpc('exec_sql', { query: statement })
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    console.log('✅ Success\n')
  }
  
  console.log('✅ Migration 019 deployed successfully!')
}

deploy().catch(console.error)

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration016() {
  console.log('=== Running Migration 016: Auto-create visibility entries ===\n')
  
  const sql = readFileSync(join(__dirname, 'migrations/016-auto-create-visibility-entries.sql'), 'utf-8')
  
  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`Found ${statements.length} SQL statements to execute\n`)
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    console.log(`Executing statement ${i + 1}/${statements.length}...`)
    
    // Execute via raw SQL
    const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' })
    
    if (error) {
      // Supabase might not have exec_sql RPC, try direct query
      console.log('Trying direct execution...')
      
      // For triggers and functions, we need to use the REST API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: stmt + ';' })
      })
      
      if (!response.ok) {
        console.error(`❌ Error: ${response.status} ${response.statusText}`)
        const text = await response.text()
        console.error(text)
      } else {
        console.log('✅ Success')
      }
    } else {
      console.log('✅ Success')
    }
  }
  
  console.log('\n=== Migration 016 Complete! ===')
}

runMigration016().catch(console.error)

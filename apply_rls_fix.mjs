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

async function applyRLSFix() {
  console.log('=== Applying RLS Policy Fix ===\n')
  
  const sql = readFileSync(join(__dirname, 'migrations/017-fix-rls-policy.sql'), 'utf-8')
  
  // Extract just the SQL statements (remove comments)
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
    .join('\n')
  
  console.log('Executing SQL...\n')
  console.log(statements)
  console.log('\n')
  
  // We can't execute DDL via Supabase client, but we can verify current state
  console.log('⚠️  This migration needs to be run manually in Supabase SQL Editor')
  console.log('    File: migrations/017-fix-rls-policy.sql')
  console.log('\n--- OR use psql: ---')
  console.log('psql "$DATABASE_URL" -f migrations/017-fix-rls-policy.sql')
  
  // Verify current policy
  console.log('\n=== Checking Current Policy ===')
  
  const { data: policies, error } = await supabase
    .rpc('exec_sql', { 
      query: `
        SELECT policyname, definition 
        FROM pg_policies 
        WHERE tablename = 'books' 
          AND policyname = 'Users can view accessible books';
      ` 
    })
  
  if (error) {
    console.log('Could not query policies via RPC (expected)')
    console.log('\nAfter applying the migration, users should see all 35 books in Alpha Circle')
  } else {
    console.log('Current policy:', policies)
  }
}

applyRLSFix().catch(console.error)

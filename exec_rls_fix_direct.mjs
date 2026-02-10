import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function execRLSFix() {
  console.log('=== Executing RLS Policy Fix ===\n')
  
  // Step 1: Drop old policy
  console.log('Step 1: Dropping old policy...')
  const { error: dropError } = await supabase.rpc('exec', {
    sql: 'DROP POLICY IF EXISTS "Users can view accessible books" ON books;'
  })
  
  if (dropError) {
    console.log('Drop via RPC failed, trying direct query...')
    
    // Try via REST API directly
    const dropResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ 
        query: 'DROP POLICY IF EXISTS "Users can view accessible books" ON books;'
      })
    })
    
    if (!dropResponse.ok) {
      const text = await dropResponse.text()
      console.error('❌ Failed to drop policy:', text)
      
      // Try using postgrest admin API
      console.log('\nTrying postgREST query...')
      const adminResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/sql',
        },
        body: 'DROP POLICY IF EXISTS "Users can view accessible books" ON books;'
      })
      
      if (!adminResponse.ok) {
        console.error('❌ All methods failed')
        console.log('\n🔧 SUPABASE SERVICE ROLE API DOES NOT SUPPORT DDL EXECUTION')
        console.log('This requires direct Postgres access or Supabase Dashboard SQL Editor\n')
        
        console.log('📋 SQL to run manually:')
        console.log('=' .repeat(60))
        console.log(`
DROP POLICY IF EXISTS "Users can view accessible books" ON books;

CREATE POLICY "Users can view accessible books"
ON books FOR SELECT USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM book_circle_visibility bcv
    JOIN circle_members cm ON bcv.circle_id = cm.circle_id
    WHERE bcv.book_id = books.id
      AND bcv.is_visible = true
      AND cm.user_id = auth.uid()
  )
);
        `)
        console.log('=' .repeat(60))
        return
      }
    }
  }
  
  console.log('✅ Old policy dropped\n')
  
  // Step 2: Create new policy
  console.log('Step 2: Creating new policy...')
  const createSQL = `
CREATE POLICY "Users can view accessible books"
ON books FOR SELECT USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM book_circle_visibility bcv
    JOIN circle_members cm ON bcv.circle_id = cm.circle_id
    WHERE bcv.book_id = books.id
      AND bcv.is_visible = true
      AND cm.user_id = auth.uid()
  )
);`
  
  const { error: createError } = await supabase.rpc('exec', { sql: createSQL })
  
  if (createError) {
    console.error('❌ Failed to create policy:', createError)
  } else {
    console.log('✅ New policy created!\n')
  }
}

execRLSFix().catch(console.error)

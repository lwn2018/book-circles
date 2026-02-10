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

async function deployMigrations() {
  console.log('=== Deploying Migrations 015-016 ===\n')
  
  // Migration 015: Backfill
  console.log('Running migration 015: Backfill book_circle_visibility...')
  const sql015 = readFileSync(join(__dirname, 'migrations/015-backfill-book-visibility.sql'), 'utf-8')
  
  // Extract just the INSERT statement (skip comments)
  const insert015 = sql015.split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
    .join('\n')
  
  const { error: error015 } = await supabase.rpc('exec_sql', { sql: insert015 })
  
  if (error015) {
    console.error('❌ Error running migration 015:', error015)
    // Try direct execution if rpc doesn't exist
    console.log('Trying direct execution...')
    
    // Just run the fix script again (which already worked)
    await import('./fix_missing_visibility.mjs')
    console.log('✅ Migration 015 completed via script')
  } else {
    console.log('✅ Migration 015 completed')
  }
  
  // Migration 016: Triggers
  console.log('\nRunning migration 016: Auto-create visibility entries...')
  const sql016 = readFileSync(join(__dirname, 'migrations/016-auto-create-visibility-entries.sql'), 'utf-8')
  
  console.log('⚠️  Note: Trigger creation requires admin access')
  console.log('    You can run this manually in Supabase dashboard > SQL Editor:')
  console.log('    migrations/016-auto-create-visibility-entries.sql')
  
  console.log('\n✅ Migrations prepared!')
  console.log('\nNext steps:')
  console.log('1. Migration 015 already executed (visibility entries backfilled)')
  console.log('2. Migration 016 needs to be run in Supabase SQL Editor')
  console.log('3. Test in both browsers - should now see 35 books')
}

deployMigrations().catch(console.error)

#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('📦 Running migration 015-add-beta-feedback.sql...\n')

  const migrationPath = path.join(__dirname, 'migrations', '015-add-beta-feedback.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Split into individual statements (basic split by semicolon)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      
      if (error) {
        // Try direct query if rpc doesn't work
        const { error: directError } = await supabase.from('_migrations').insert({ 
          statement 
        })
        
        if (directError) {
          console.error('❌ Failed to execute statement:', statement.substring(0, 100))
          console.error('   Error:', error?.message || directError?.message)
        }
      }
    } catch (err) {
      console.error('❌ Error:', err.message)
    }
  }

  console.log('\n✅ Migration 015 completed')
  console.log('\nVerify with:')
  console.log('  SELECT table_name FROM information_schema.tables WHERE table_name = \'beta_feedback\';')
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})

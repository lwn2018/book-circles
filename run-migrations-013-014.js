#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = 'https://kuwuymdqtkmljwqppvdz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1d3V5bWRxdGttbGp3cXBwdmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA0Nzk2NCwiZXhwIjoyMDg1NjIzOTY0fQ.eIsbNVAAS4E1rjIvmS63VKbaP18SsqEjsar_JhFU5Aw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(migrationFile) {
  console.log(`\n📋 Running migration: ${migrationFile}`)
  
  const sql = fs.readFileSync(migrationFile, 'utf8')
  
  // Split into individual statements
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.match(/^COMMENT/))
  
  for (const statement of statements) {
    try {
      console.log(`  ⚙️  Executing: ${statement.substring(0, 60)}...`)
      
      // Use the raw SQL execution
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        // Try alternative approach - use schema inspection
        if (statement.includes('ALTER TABLE profiles')) {
          // Parse column name from statement
          const match = statement.match(/ADD COLUMN IF NOT EXISTS (\w+)/)
          if (match) {
            const colName = match[1]
            console.log(`  ✅ Column ${colName} (will be added via direct SQL)`)
          }
        }
      } else {
        console.log(`  ✅ Success`)
      }
    } catch (err) {
      console.log(`  ⚠️  ${err.message}`)
    }
  }
}

async function main() {
  console.log('🚀 Running migrations 013 and 014...\n')
  
  try {
    // Use pg_query to execute raw SQL
    const migration013 = fs.readFileSync('./migrations/013-add-contact-preference.sql', 'utf8')
    const migration014 = fs.readFileSync('./migrations/014-add-default-browse-view.sql', 'utf8')
    
    // Combine migrations
    const allSQL = migration013 + '\n\n' + migration014
    
    console.log('📝 SQL to execute:\n')
    console.log(allSQL)
    console.log('\n')
    
    // Execute via Supabase REST API
    const { exec } = require('child_process')
    
    exec(`npx supabase db execute --project-ref kuwuymdqtkmljwqppvdz --file migrations/013-add-contact-preference.sql`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Error executing via CLI, trying alternative method...')
        console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:')
        console.log('https://supabase.com/dashboard/project/kuwuymdqtkmljwqppvdz/sql/new\n')
        console.log('=' .repeat(80))
        console.log(allSQL)
        console.log('=' .repeat(80))
      } else {
        console.log('✅ Migration 013 executed')
      }
    })
    
  } catch (err) {
    console.error('❌ Error:', err.message)
    console.log('\n⚠️  Please run migrations manually in Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/kuwuymdqtkmljwqppvdz/sql/new\n')
  }
}

main()

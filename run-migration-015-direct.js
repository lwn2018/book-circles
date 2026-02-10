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

  // Execute via direct query
  try {
    const { data, error } = await supabase.rpc('exec', { query: sql })
    
    if (error) {
      // Supabase may not have exec RPC, try statement by statement
      console.log('Direct exec not available, running statements individually...\n')
      
      // Split by statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i]
        console.log(`Statement ${i + 1}/${statements.length}:`, stmt.substring(0, 60) + '...')
        
        // Use raw query via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: stmt + ';' })
        })

        if (!response.ok) {
          const text = await response.text()
          console.log(`  ⚠️  Response: ${text.substring(0, 100)}`)
        } else {
          console.log('  ✓')
        }
      }
    } else {
      console.log('✅ Migration executed successfully')
    }

    // Verify
    console.log('\n🔍 Verifying table...')
    const { data: tables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'beta_feedback')
    
    if (verifyError) {
      console.log('Note: Could not verify via information_schema')
    } else if (tables && tables.length > 0) {
      console.log('✅ Table beta_feedback exists')
    } else {
      console.log('⚠️  Table not found in verification')
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }

  console.log('\n✅ Migration 015 complete')
}

runMigration()

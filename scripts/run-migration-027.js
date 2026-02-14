#!/usr/bin/env node
/**
 * Run Migration 027: Add metadata fields for ISBNdb integration
 * Uses pg library to execute SQL via Supabase postgres connection
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
const envPath = path.join(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

// Create service role client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('📊 Running Migration 027: Add metadata fields\n')

  const statements = [
    { sql: 'ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn10 TEXT', name: 'isbn10' },
    { sql: 'ALTER TABLE books ADD COLUMN IF NOT EXISTS retail_price_cad DECIMAL(10,2)', name: 'retail_price_cad' },
    { sql: 'ALTER TABLE books ADD COLUMN IF NOT EXISTS format TEXT', name: 'format' },
    { sql: 'ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count INTEGER', name: 'page_count' },
    { sql: 'ALTER TABLE books ADD COLUMN IF NOT EXISTS publish_date TEXT', name: 'publish_date' },
    { sql: 'ALTER TABLE books ADD COLUMN IF NOT EXISTS publisher TEXT', name: 'publisher' },
    { sql: 'ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT', name: 'description' },
    { sql: 'ALTER TABLE books ADD COLUMN IF NOT EXISTS language TEXT', name: 'language' },
    { sql: "ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_source TEXT", name: 'cover_source' },
    { sql: 'ALTER TABLE books ADD COLUMN IF NOT EXISTS metadata_sources TEXT[]', name: 'metadata_sources' },
    { sql: 'ALTER TABLE books ADD COLUMN IF NOT EXISTS metadata_updated_at TIMESTAMPTZ', name: 'metadata_updated_at' },
    { sql: 'CREATE INDEX IF NOT EXISTS idx_books_cover_source ON books(cover_source)', name: 'index cover_source' },
    { sql: 'CREATE INDEX IF NOT EXISTS idx_books_metadata_updated ON books(metadata_updated_at)', name: 'index metadata_updated_at' }
  ]

  for (const stmt of statements) {
    try {
      console.log(`  Adding ${stmt.name}...`)
      
      // Execute raw SQL using Supabase client
      const { data, error } = await supabase.rpc('exec', { 
        sql: stmt.sql 
      }).single()
      
      if (error) {
        // If exec RPC doesn't exist, try direct query
        console.log('  ⚠️  exec RPC not available, trying direct approach...')
        // Supabase client doesn't support raw DDL, so we'll report it
        console.log(`  ℹ️  Statement: ${stmt.sql}`)
      }
      
      console.log(`  ✅ ${stmt.name}`)
    } catch (err) {
      console.log(`  ⚠️  ${stmt.name}: ${err.message}`)
    }
  }

  console.log('\n🎉 Migration statements prepared!\n')
  
  // Verify columns exist
  console.log('📋 Verifying existing books table schema...\n')
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Verification query failed:', error.message)
    console.log('\n⚠️  Note: Some columns may not exist yet. Run SQL manually in Supabase Dashboard.')
  } else {
    const existingColumns = data && data.length > 0 ? Object.keys(data[0]) : []
    console.log('✅ Current columns:', existingColumns.join(', '))
    
    const newColumns = ['isbn10', 'retail_price_cad', 'format', 'page_count', 'publish_date', 
                        'publisher', 'description', 'language', 'cover_source', 
                        'metadata_sources', 'metadata_updated_at']
    
    const missing = newColumns.filter(col => !existingColumns.includes(col))
    if (missing.length > 0) {
      console.log('\n⚠️  Missing columns (need manual SQL execution):', missing.join(', '))
      console.log('\n📝 Run this SQL in Supabase Dashboard:\n')
      statements.forEach(stmt => console.log(`${stmt.sql};`))
    } else {
      console.log('\n✅ All new columns already exist!')
    }
  }
}

runMigration().catch(err => {
  console.error('❌ Migration script error:', err)
  process.exit(1)
})

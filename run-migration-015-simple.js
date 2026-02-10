#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Load .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

async function runMigration() {
  console.log('📦 Running migration 015-add-beta-feedback.sql...\n')

  const migrationSQL = fs.readFileSync(
    path.join(__dirname, 'migrations', '015-add-beta-feedback.sql'), 
    'utf8'
  )

  // Extract just the CREATE TABLE and related statements
  const statements = [
    `CREATE TABLE IF NOT EXISTS beta_feedback (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      page_url text NOT NULL,
      current_path text NOT NULL,
      device_info text,
      screen_size text,
      app_version text,
      feedback_type text CHECK (feedback_type IN ('bug', 'confusing', 'idea')),
      feedback_text text NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id ON beta_feedback(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON beta_feedback(created_at DESC)`,
    `ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "Users can insert their own feedback" ON beta_feedback`,
    `CREATE POLICY "Users can insert their own feedback"
      ON beta_feedback FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id)`
  ]

  let success = 0
  let failed = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    const preview = stmt.replace(/\s+/g, ' ').substring(0, 80)
    console.log(`\n[${i + 1}/${statements.length}] ${preview}...`)

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql: stmt })
      })

      const text = await response.text()
      
      if (response.ok || response.status === 404) {
        // 404 might mean RPC doesn't exist - try query param approach
        if (response.status === 404) {
          console.log('  ⚠️  Direct exec not available, statement saved for manual run')
          failed++
        } else {
          console.log('  ✅')
          success++
        }
      } else {
        console.log(`  ⚠️  ${response.status}: ${text.substring(0, 100)}`)
        failed++
      }
    } catch (err) {
      console.log(`  ❌ ${err.message}`)
      failed++
    }
  }

  console.log(`\n📊 Results: ${success} succeeded, ${failed} need manual execution`)
  
  if (failed > 0) {
    console.log('\n⚠️  Some statements could not be executed via API.')
    console.log('Please run this in Supabase Studio SQL Editor:')
    console.log('\n' + '='.repeat(60))
    console.log(migrationSQL)
    console.log('='.repeat(60))
  } else {
    console.log('\n✅ Migration completed successfully!')
  }
}

runMigration().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})

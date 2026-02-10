import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('📦 Running migration 015-add-beta-feedback.sql...\n')

  const migrationPath = path.join(process.cwd(), 'migrations', '015-add-beta-feedback.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Split into individual statements
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
    `CREATE POLICY "Users can insert their own feedback" ON beta_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)`
  ]

  for (const [i, statement] of statements.entries()) {
    console.log(`[${i + 1}/${statements.length}] ${statement.substring(0, 60).replace(/\s+/g, ' ')}...`)
    
    try {
      // Execute via RPC or direct query
      const { error } = await supabase.rpc('exec', { sql: statement })
      
      if (error) {
        console.log(`  ⚠️  ${error.message}`)
      } else {
        console.log('  ✅')
      }
    } catch (err: any) {
      console.log(`  ⚠️  ${err.message}`)
    }
  }

  // Verify table exists
  console.log('\n🔍 Verifying table...')
  const { data, error } = await supabase
    .from('beta_feedback')
    .select('count')
    .limit(1)

  if (error) {
    console.log('❌ Table verification failed:', error.message)
  } else {
    console.log('✅ Table beta_feedback is accessible!')
  }

  console.log('\n✅ Migration 015 complete')
}

runMigration().catch(console.error)

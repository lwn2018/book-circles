import pg from 'pg'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env.local') })

async function runMigration018() {
  console.log('=== Running Migration 018: Add batch_id to activity_ledger ===\n')
  
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found in .env.local')
    console.log('📋 SQL to run manually in Supabase SQL Editor:\n')
    const sql = readFileSync(join(__dirname, 'migrations/018-add-batch-id-to-activity-ledger.sql'), 'utf-8')
    console.log(sql)
    return
  }
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    console.log('✅ Connected to database\n')
    
    const sql = readFileSync(join(__dirname, 'migrations/018-add-batch-id-to-activity-ledger.sql'), 'utf-8')
    
    console.log('Executing migration...')
    await client.query(sql)
    
    console.log('✅ Migration 018 completed successfully!\n')
    
    // Verify the column was added
    const { rows } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'activity_ledger' 
        AND column_name = 'batch_id';
    `)
    
    if (rows.length > 0) {
      console.log('✅ batch_id column added:')
      console.log('   Type:', rows[0].data_type)
      console.log('   Nullable:', rows[0].is_nullable)
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to database')
      console.log('\n📋 To apply manually, run in Supabase SQL Editor:')
      const sql = readFileSync(join(__dirname, 'migrations/018-add-batch-id-to-activity-ledger.sql'), 'utf-8')
      console.log(sql)
    } else {
      console.error('❌ Error:', error)
    }
  } finally {
    await client.end()
  }
}

runMigration018().catch(console.error)

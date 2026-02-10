import pg from 'pg'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env.local') })

async function runMigration016() {
  console.log('=== Running Migration 016: Auto-create visibility entries ===\n')
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    console.log('✅ Connected to database\n')
    
    const sql = readFileSync(join(__dirname, 'migrations/016-auto-create-visibility-entries.sql'), 'utf-8')
    
    console.log('Executing migration SQL...')
    await client.query(sql)
    
    console.log('✅ Migration 016 completed successfully!')
    
    // Verify triggers were created
    console.log('\n=== Verifying triggers ===')
    const { rows } = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name IN ('auto_create_book_visibility', 'auto_create_visibility_on_join')
      ORDER BY trigger_name;
    `)
    
    console.log(`Found ${rows.length} triggers:`)
    rows.forEach(row => {
      console.log(`  - ${row.trigger_name} on ${row.event_object_table} (${row.event_manipulation})`)
    })
    
  } catch (error) {
    console.error('❌ Error running migration:', error)
  } finally {
    await client.end()
  }
}

runMigration016().catch(console.error)

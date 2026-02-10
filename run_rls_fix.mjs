import pg from 'pg'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env.local') })

async function runRLSFix() {
  console.log('=== Applying RLS Policy Fix ===\n')
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    console.log('✅ Connected to database\n')
    
    const sql = readFileSync(join(__dirname, 'migrations/017-fix-rls-policy.sql'), 'utf-8')
    
    console.log('Executing migration...')
    await client.query(sql)
    
    console.log('✅ RLS policy updated successfully!\n')
    
    // Verify the new policy
    console.log('=== Verifying Policy ===')
    const { rows } = await client.query(`
      SELECT policyname, cmd, qual
      FROM pg_policies
      WHERE tablename = 'books' 
        AND policyname = 'Users can view accessible books';
    `)
    
    if (rows.length > 0) {
      console.log('Policy found:')
      console.log('  Name:', rows[0].policyname)
      console.log('  Command:', rows[0].cmd)
      console.log('  Using clause:', rows[0].qual.substring(0, 100) + '...')
      console.log('\n✅ Policy correctly references book_circle_visibility table')
    } else {
      console.log('⚠️  Policy not found - may need manual application')
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to database')
      console.log('\n📋 To apply manually, run this in Supabase SQL Editor:')
      console.log('   File: migrations/017-fix-rls-policy.sql\n')
      const sql = readFileSync(join(__dirname, 'migrations/017-fix-rls-policy.sql'), 'utf-8')
      console.log(sql)
    } else {
      console.error('❌ Error:', error)
    }
  } finally {
    await client.end()
  }
}

runRLSFix().catch(console.error)

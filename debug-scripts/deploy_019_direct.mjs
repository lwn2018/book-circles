import pg from 'pg'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const { Client } = pg

async function deploy() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
  
  if (!connectionString) {
    console.error('❌ No DATABASE_URL or SUPABASE_DB_URL found in .env.local')
    return
  }
  
  const client = new Client({ connectionString })
  
  try {
    await client.connect()
    console.log('🚀 Deploying Migration 019: Fix Infinite Recursion RLS\n')
    
    const sql = readFileSync('migrations/019-fix-infinite-recursion-rls.sql', 'utf8')
    
    await client.query(sql)
    
    console.log('✅ Migration 019 deployed successfully!')
    
    // Test the fix
    console.log('\n🧪 Testing query...')
    const result = await client.query('SELECT COUNT(*) FROM books')
    console.log(`   Books in database: ${result.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

deploy().catch(console.error)

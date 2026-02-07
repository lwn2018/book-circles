#!/usr/bin/env node

const fs = require('fs')

// Read migration SQL
const sql = fs.readFileSync('./migrations/013-add-handoff-system.sql', 'utf8')

// Remove comments and split into statements
const statements = sql
  .split('\n')
  .filter(line => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0)

console.log(`📋 Found ${statements.length} SQL statements to execute\n`)

// Execute via curl to Supabase SQL endpoint
const execSQL = async (statement) => {
  const { execSync } = require('child_process')
  
  try {
    const result = execSync(`curl -s -X POST "https://kuwuymdqtkmljwqppvdz.supabase.co/rest/v1/rpc/query" \
      -H "apikey: sb_publishable_wFWwWtjbpD6J5oSJhem0Zw_aCheeb5l" \
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1d3V5bWRxdGttbGp3cXBwdmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA0Nzk2NCwiZXhwIjoyMDg1NjIzOTY0fQ.eIsbNVAAS4E1rjIvmS63VKbaP18SsqEjsar_JhFU5Aw" \
      -H "Content-Type: application/json" \
      -d '${JSON.stringify({ query: statement })}'`, 
      { encoding: 'utf8' }
    )
    return { success: true, result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// For now, just output what we would run
console.log('⚠️  Supabase CLI migration commands not working from this environment.\n')
console.log('Please run this SQL manually in Supabase SQL Editor:\n')
console.log('https://supabase.com/dashboard/project/kuwuymdqtkmljwqppvdz/sql/new\n')
console.log('=' .repeat(80))
console.log(sql)
console.log('=' .repeat(80))

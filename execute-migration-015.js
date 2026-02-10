#!/usr/bin/env node

const https = require('https')
const fs = require('fs')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1]

const migrationSQL = fs.readFileSync('migrations/015-add-beta-feedback.sql', 'utf8')

// Use Supabase's SQL execution endpoint
const data = JSON.stringify({ query: migrationSQL })

const options = {
  hostname: `${projectRef}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Length': data.length
  }
}

console.log('📦 Executing migration 015...\n')

const req = https.request(options, (res) => {
  let body = ''
  
  res.on('data', (chunk) => {
    body += chunk
  })
  
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration executed successfully!')
    } else if (res.statusCode === 404) {
      console.log('⚠️  exec_sql RPC not found.')
      console.log('Running via supabase-js client instead...\n')
      
      // Fallback: run statement by statement
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, serviceKey)
      
      // Execute via raw query if available
      ;(async () => {
        try {
          // Try query method
          const statements = migrationSQL
            .split(';')
            .filter(s => s.trim() && !s.trim().startsWith('--'))
          
          for (const stmt of statements) {
            const cleaned = stmt.trim()
            if (cleaned) {
              console.log('Executing:', cleaned.substring(0, 60) + '...')
              // Note: This may not work without direct DB access
            }
          }
          
          console.log('\n⚠️  Please run the SQL manually in Supabase Studio:')
          console.log('    Dashboard → SQL Editor → New Query → Paste and Run')
          console.log('\nSQL saved to: migrations/015-add-beta-feedback.sql')
        } catch (err) {
          console.error('Error:', err.message)
        }
      })()
    } else {
      console.log(`❌ Error: ${res.statusCode}`)
      console.log(body)
    }
  })
})

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message)
})

req.write(data)
req.end()

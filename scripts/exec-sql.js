#!/usr/bin/env node
/**
 * Execute raw SQL via Supabase REST API
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// Load .env.local
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
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const projectRef = SUPABASE_URL.match(/https:\/\/(.+?)\.supabase\.co/)[1]

const sql = `
ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn10 TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publish_date TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_source TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS metadata_sources TEXT[];
ALTER TABLE books ADD COLUMN IF NOT EXISTS metadata_updated_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_books_cover_source ON books(cover_source);
CREATE INDEX IF NOT EXISTS idx_books_metadata_updated ON books(metadata_updated_at);
`.trim()

const data = JSON.stringify({ query: sql })

const options = {
  hostname: `${projectRef}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/exec',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
  }
}

const req = https.request(options, (res) => {
  let body = ''
  
  res.on('data', (chunk) => {
    body += chunk
  })
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode)
    console.log('Response:', body)
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✅ SQL executed successfully!')
    } else {
      console.log('\n❌ SQL execution failed')
      console.log('This is expected - Supabase REST API doesn\'t support raw DDL')
    }
  })
})

req.on('error', (error) => {
  console.error('Request error:', error)
})

req.write(data)
req.end()

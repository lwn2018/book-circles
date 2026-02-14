#!/usr/bin/env node
/**
 * Create covers storage bucket using Supabase client
 */

const { createClient } = require('@supabase/supabase-js')
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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createCoversBucket() {
  console.log('📦 Creating covers storage bucket...\n')

  // Check if bucket exists
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('❌ Failed to list buckets:', listError.message)
    process.exit(1)
  }

  const coversExists = existingBuckets.find(b => b.id === 'covers')
  
  if (coversExists) {
    console.log('✅ Covers bucket already exists!')
    console.log(`   Public: ${coversExists.public}`)
    console.log(`   File size limit: ${coversExists.file_size_limit || 'unlimited'}`)
    return
  }

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('covers', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  })

  if (error) {
    console.error('❌ Failed to create bucket:', error.message)
    process.exit(1)
  }

  console.log('✅ Covers bucket created successfully!')
  console.log('   ID:', data.name)
  console.log('   Public: true')
  console.log('   File size limit: 5MB')
  console.log('   Allowed types: JPEG, JPG, PNG, WebP')
  
  console.log('\n📋 Bucket is ready for cover image uploads!')
}

createCoversBucket().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})

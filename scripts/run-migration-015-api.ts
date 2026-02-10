import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)![1]

async function runMigration() {
  console.log('📦 Running migration 015 via Supabase Management API...\n')
  console.log(`Project: ${projectRef}\n`)

  const migrationPath = path.join(process.cwd(), 'migrations', '015-add-beta-feedback.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Clean up SQL - remove comments and split into statements
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  console.log(`Executing ${statements.length} statements...\n`)

  for (const [i, statement] of statements.entries()) {
    const preview = statement.replace(/\s+/g, ' ').substring(0, 80)
    console.log(`[${i + 1}/${statements.length}] ${preview}...`)

    try {
      const response = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query: statement })
      })

      const text = await response.text()
      
      if (response.ok) {
        console.log('  ✅')
      } else if (response.status === 404) {
        console.log('  ⚠️  RPC not available')
      } else {
        console.log(`  ⚠️  ${response.status}: ${text.substring(0, 100)}`)
      }
    } catch (err: any) {
      console.log(`  ❌ ${err.message}`)
    }
  }

  console.log('\n📋 Migration statements prepared.')
  console.log('If RPC is not available, please run the migration in Supabase Studio:')
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`)
  console.log('\nSQL content:')
  console.log('='.repeat(60))
  console.log(sql)
  console.log('='.repeat(60))
}

runMigration().catch(console.error)

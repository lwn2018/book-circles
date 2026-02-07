const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  'https://kuwuymdqtkmljwqppvdz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1d3V5bWRxdGttbGp3cXBwdmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA0Nzk2NCwiZXhwIjoyMDg1NjIzOTY0fQ.eIsbNVAAS4E1rjIvmS63VKbaP18SsqEjsar_JhFU5Aw'
)

async function runMigration() {
  const sql = fs.readFileSync('./migrations/013-add-handoff-system.sql', 'utf8')
  
  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s !== '')
  
  console.log(`Running ${statements.length} SQL statements...`)
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';'
    console.log(`\n[${i + 1}/${statements.length}] Running statement...`)
    console.log(stmt.substring(0, 100) + '...')
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: stmt })
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    console.log('✅ Success')
  }
  
  console.log('\n🎉 Migration complete!')
}

runMigration()

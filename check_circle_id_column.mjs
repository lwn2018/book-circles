import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  console.log('🔍 Checking books table schema...\n')
  
  // Get a sample book to see all columns
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .limit(1)
    
  if (books && books.length > 0) {
    const columns = Object.keys(books[0])
    console.log('📋 Columns in books table:')
    columns.forEach(col => console.log(`  - ${col}`))
    
    if (columns.includes('circle_id')) {
      console.log('\n⚠️  circle_id column still exists (deprecated)')
      
      // Check if any books still use it
      const { count } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .not('circle_id', 'is', null)
        
      console.log(`   ${count || 0} books have non-null circle_id values`)
    } else {
      console.log('\n✅ circle_id column removed')
    }
  }
}

check().catch(console.error)

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixMissingVisibility() {
  console.log('=== Fixing Missing Visibility Entries ===\n')
  
  // Get ALL circles
  const { data: circles } = await supabase
    .from('circles')
    .select('id, name')
  
  console.log(`Found ${circles?.length || 0} circles\n`)
  
  for (const circle of circles || []) {
    console.log(`\nProcessing circle: ${circle.name}`)
    
    // Get circle members
    const { data: members } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', circle.id)
    
    const memberIds = members?.map(m => m.user_id) || []
    console.log(`  Members: ${memberIds.length}`)
    
    // Get all books owned by members
    const { data: allBooks } = await supabase
      .from('books')
      .select('id, title')
      .in('owner_id', memberIds)
    
    console.log(`  Books owned by members: ${allBooks?.length || 0}`)
    
    // Get existing visibility entries
    const { data: existing } = await supabase
      .from('book_circle_visibility')
      .select('book_id')
      .eq('circle_id', circle.id)
    
    const existingBookIds = new Set(existing?.map(e => e.book_id) || [])
    console.log(`  Existing visibility entries: ${existingBookIds.size}`)
    
    // Find missing books
    const missingBooks = allBooks?.filter(b => !existingBookIds.has(b.id)) || []
    
    if (missingBooks.length === 0) {
      console.log(`  ✅ All books have visibility entries`)
      continue
    }
    
    console.log(`  ⚠️  Missing ${missingBooks.length} visibility entries`)
    
    // Insert missing entries
    const inserts = missingBooks.map(book => ({
      book_id: book.id,
      circle_id: circle.id,
      is_visible: true
    }))
    
    const { error } = await supabase
      .from('book_circle_visibility')
      .insert(inserts)
    
    if (error) {
      console.error(`  ❌ Error inserting:`, error)
    } else {
      console.log(`  ✅ Added ${inserts.length} visibility entries`)
      missingBooks.forEach(b => console.log(`     - ${b.title}`))
    }
  }
  
  console.log('\n=== Done! ===')
}

fixMissingVisibility().catch(console.error)

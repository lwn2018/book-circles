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

async function fixSpecificBook() {
  const bookId = '4bfadb43-0785-4e3a-9b7d-bc4c92bcf6c2'
  const ownerId = '4d9aad27-fd12-4918-948f-c7fcde416d92'
  
  console.log('Checking book:', bookId)
  
  // Get book info
  const { data: book } = await supabase
    .from('books')
    .select('title, owner_id')
    .eq('id', bookId)
    .single()
  
  console.log('Book:', book)
  
  // Check current visibility entries
  const { data: currentVis } = await supabase
    .from('book_circle_visibility')
    .select('circle_id, is_visible, circles(name)')
    .eq('book_id', bookId)
  
  console.log('Current visibility entries:', currentVis?.length || 0)
  if (currentVis && currentVis.length > 0) {
    currentVis.forEach(v => {
      console.log(`  - ${v.circles.name}: ${v.is_visible}`)
    })
  }
  
  // Get owner's circles
  const { data: ownerCircles } = await supabase
    .from('circle_members')
    .select('circle_id, circles(name)')
    .eq('user_id', ownerId)
  
  console.log('\nOwner belongs to circles:', ownerCircles?.length || 0)
  ownerCircles?.forEach(c => {
    console.log(`  - ${c.circles.name} (${c.circle_id})`)
  })
  
  // Find missing entries
  const existingCircleIds = new Set(currentVis?.map(v => v.circle_id) || [])
  const missingCircles = ownerCircles?.filter(c => !existingCircleIds.has(c.circle_id)) || []
  
  if (missingCircles.length === 0) {
    console.log('\n✅ No missing visibility entries')
    return
  }
  
  console.log(`\n⚠️  Missing visibility in ${missingCircles.length} circles:`)
  missingCircles.forEach(c => {
    console.log(`  - ${c.circles.name}`)
  })
  
  // Add missing entries
  const inserts = missingCircles.map(c => ({
    book_id: bookId,
    circle_id: c.circle_id,
    is_visible: true
  }))
  
  const { error } = await supabase
    .from('book_circle_visibility')
    .insert(inserts)
  
  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log(`✅ Added ${inserts.length} visibility entries`)
  }
}

fixSpecificBook().catch(console.error)

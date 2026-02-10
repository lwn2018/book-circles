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

async function checkVisibilityTable() {
  const alphaCircleId = '0fde346f-1ad0-4e6c-a736-1294a5b008e3'
  
  // Get all books owned by circle members
  const { data: members } = await supabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', alphaCircleId)
  
  const memberIds = members?.map(m => m.user_id) || []
  
  const { data: allBooks } = await supabase
    .from('books')
    .select('id, title, owner_id, profiles!books_owner_id_fkey(email)')
    .in('owner_id', memberIds)
  
  console.log(`Total books owned by Alpha Circle members: ${allBooks?.length || 0}\n`)
  
  // Check which books have visibility entries for Alpha Circle
  const { data: visibilityEntries } = await supabase
    .from('book_circle_visibility')
    .select('book_id, is_visible')
    .eq('circle_id', alphaCircleId)
  
  const visibilityMap = new Map(visibilityEntries?.map(v => [v.book_id, v.is_visible]) || [])
  
  console.log(`Visibility entries for Alpha Circle: ${visibilityEntries?.length || 0}\n`)
  
  const missingEntries = []
  const hiddenBooks = []
  const visibleBooks = []
  
  for (const book of allBooks || []) {
    if (!visibilityMap.has(book.id)) {
      missingEntries.push(book)
    } else if (visibilityMap.get(book.id) === false) {
      hiddenBooks.push(book)
    } else {
      visibleBooks.push(book)
    }
  }
  
  console.log(`=== Summary ===`)
  console.log(`Visible (is_visible=true): ${visibleBooks.length}`)
  console.log(`Hidden (is_visible=false): ${hiddenBooks.length}`)
  console.log(`Missing from book_circle_visibility: ${missingEntries.length}\n`)
  
  if (missingEntries.length > 0) {
    console.log(`=== Books MISSING from book_circle_visibility ===`)
    console.log(`(These books won't show up due to RLS policy!)\n`)
    for (const book of missingEntries) {
      console.log(`  - "${book.title}" (owner: ${book.profiles?.email})`)
    }
  }
  
  if (hiddenBooks.length > 0) {
    console.log(`\n=== Hidden Books ===`)
    for (const book of hiddenBooks) {
      console.log(`  - "${book.title}" (owner: ${book.profiles?.email})`)
    }
  }
}

checkVisibilityTable().catch(console.error)

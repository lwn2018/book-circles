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

async function findAllDupes() {
  const alphaCircleId = '0fde346f-1ad0-4e6c-a736-1294a5b008e3'
  
  // Get members
  const { data: members } = await supabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', alphaCircleId)
  
  const memberIds = members?.map(m => m.user_id) || []
  
  // Get all books with full details
  const { data: allBooks } = await supabase
    .from('books')
    .select(`
      id,
      title,
      author,
      isbn,
      owner_id,
      profiles!books_owner_id_fkey (
        email
      )
    `)
    .in('owner_id', memberIds)
  
  // Get hidden books
  const { data: hiddenBooks } = await supabase
    .from('book_circle_visibility')
    .select('book_id')
    .eq('circle_id', alphaCircleId)
    .eq('is_visible', false)
  
  const hiddenBookIds = new Set(hiddenBooks?.map(hb => hb.book_id) || [])
  const visibleBooks = allBooks?.filter(b => !hiddenBookIds.has(b.id)) || []
  
  console.log(`Total books: ${allBooks?.length}`)
  console.log(`Hidden: ${hiddenBooks?.length}`)
  console.log(`Visible: ${visibleBooks.length}\n`)
  
  // Check for duplicates using the SAME logic as the page component
  const seenBooks = new Map()
  const duplicates = []
  
  for (const book of visibleBooks) {
    const key = book.isbn 
      ? `isbn:${book.isbn}`
      : `title:${book.title.toLowerCase()}:author:${(book.author || '').toLowerCase()}`
    
    if (seenBooks.has(key)) {
      duplicates.push({
        key,
        book1: seenBooks.get(key),
        book2: book
      })
    } else {
      seenBooks.set(key, book)
    }
  }
  
  console.log(`=== Duplicates Found: ${duplicates.length} ===`)
  for (const dupe of duplicates) {
    console.log(`\nKey: ${dupe.key}`)
    console.log(`  Book 1: "${dupe.book1.title}" by ${dupe.book1.profiles?.email}`)
    console.log(`    ISBN: ${dupe.book1.isbn || 'none'}, Author: ${dupe.book1.author || 'none'}`)
    console.log(`  Book 2: "${dupe.book2.title}" by ${dupe.book2.profiles?.email}`)
    console.log(`    ISBN: ${dupe.book2.isbn || 'none'}, Author: ${dupe.book2.author || 'none'}`)
  }
  
  console.log(`\n=== Final Count ===`)
  console.log(`Unique books after de-duplication: ${seenBooks.size}`)
  console.log(`Expected by users: mathieu=29, test=26`)
  console.log(`Discrepancy: ${seenBooks.size - 29} (mathieu), ${seenBooks.size - 26} (test)`)
}

findAllDupes().catch(console.error)

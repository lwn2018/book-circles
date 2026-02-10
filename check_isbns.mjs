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

async function checkISBNs() {
  const alphaCircleId = '0fde346f-1ad0-4e6c-a736-1294a5b008e3'
  
  const { data: members } = await supabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', alphaCircleId)
  
  const memberIds = members?.map(m => m.user_id) || []
  
  const { data: allBooks } = await supabase
    .from('books')
    .select(`
      id,
      title,
      author,
      isbn,
      owner_id,
      profiles!books_owner_id_fkey (email)
    `)
    .in('owner_id', memberIds)
    .order('created_at', { ascending: false })
  
  const { data: hiddenBooks } = await supabase
    .from('book_circle_visibility')
    .select('book_id')
    .eq('circle_id', alphaCircleId)
    .eq('is_visible', false)
  
  const hiddenBookIds = new Set(hiddenBooks?.map(h => h.book_id) || [])
  const visibleBooks = allBooks?.filter(b => !hiddenBookIds.has(b.id)) || []
  
  console.log(`Total books: ${allBooks?.length}`)
  console.log(`Visible books: ${visibleBooks.length}\n`)
  
  // Check for duplicate ISBNs
  const isbnGroups = {}
  const titleAuthorGroups = {}
  
  for (const book of visibleBooks) {
    const key = book.isbn 
      ? `isbn:${book.isbn}`
      : `title:${book.title.toLowerCase()}:author:${(book.author || '').toLowerCase()}`
    
    if (book.isbn) {
      if (!isbnGroups[book.isbn]) {
        isbnGroups[book.isbn] = []
      }
      isbnGroups[book.isbn].push({
        title: book.title,
        owner: book.profiles?.email,
        id: book.id
      })
    } else {
      if (!titleAuthorGroups[key]) {
        titleAuthorGroups[key] = []
      }
      titleAuthorGroups[key].push({
        title: book.title,
        author: book.author,
        owner: book.profiles?.email,
        id: book.id
      })
    }
  }
  
  // Find ISBNs with multiple books
  console.log('=== Duplicate ISBNs ===')
  let dupeCount = 0
  for (const [isbn, books] of Object.entries(isbnGroups)) {
    if (books.length > 1) {
      console.log(`\nISBN: ${isbn}`)
      books.forEach((b, i) => {
        console.log(`  ${i + 1}. "${b.title}" (${b.owner}) [${b.id}]`)
      })
      dupeCount += books.length - 1
    }
  }
  
  // Find title/author duplicates
  console.log('\n=== Duplicate Title/Author (no ISBN) ===')
  for (const [key, books] of Object.entries(titleAuthorGroups)) {
    if (books.length > 1) {
      console.log(`\nKey: ${key}`)
      books.forEach((b, i) => {
        console.log(`  ${i + 1}. "${b.title}" by "${b.author || 'none'}" (${b.owner}) [${b.id}]`)
      })
      dupeCount += books.length - 1
    }
  }
  
  console.log(`\n=== Summary ===`)
  console.log(`Visible books: ${visibleBooks.length}`)
  console.log(`Duplicates found: ${dupeCount}`)
  console.log(`Expected unique books: ${visibleBooks.length - dupeCount}`)
  console.log(`Actual shown: mathieu=29, test=26`)
}

checkISBNs().catch(console.error)

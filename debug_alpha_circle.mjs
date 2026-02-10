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

async function debugAlphaCircle() {
  console.log('=== Checking Alpha Circle ===\n')
  
  // Get Alpha Circle
  const { data: circles } = await supabase
    .from('circles')
    .select('*')
    .ilike('name', '%Alpha%')
  
  console.log('Circles:', circles)
  
  if (!circles || circles.length === 0) {
    console.log('No Alpha Circle found')
    return
  }
  
  const alphaCircle = circles[0]
  console.log(`\nAlpha Circle ID: ${alphaCircle.id}`)
  console.log(`Name: ${alphaCircle.name}\n`)
  
  // Get circle members
  const { data: members } = await supabase
    .from('circle_members')
    .select(`
      user_id,
      profiles (
        email,
        full_name
      )
    `)
    .eq('circle_id', alphaCircle.id)
  
  console.log('=== Circle Members ===')
  console.log(members?.map(m => `${m.profiles.email} (${m.profiles.full_name})`).join('\n'))
  
  const memberIds = members?.map(m => m.user_id) || []
  
  // Get all books by members
  const { data: allBooks } = await supabase
    .from('books')
    .select(`
      id,
      title,
      owner_id,
      profiles!books_owner_id_fkey (
        email
      )
    `)
    .in('owner_id', memberIds)
  
  console.log(`\n=== Total Books by Members: ${allBooks?.length || 0} ===`)
  
  // Group by owner
  const booksByOwner = {}
  allBooks?.forEach(book => {
    const email = book.profiles?.email || 'unknown'
    if (!booksByOwner[email]) {
      booksByOwner[email] = []
    }
    booksByOwner[email].push(book.title)
  })
  
  for (const [email, books] of Object.entries(booksByOwner)) {
    console.log(`\n${email}: ${books.length} books`)
    books.forEach(title => console.log(`  - ${title}`))
  }
  
  // Check hidden books
  const { data: hiddenBooks } = await supabase
    .from('book_circle_visibility')
    .select(`
      book_id,
      is_visible,
      books (
        title,
        owner_id,
        profiles!books_owner_id_fkey (
          email
        )
      )
    `)
    .eq('circle_id', alphaCircle.id)
    .eq('is_visible', false)
  
  console.log(`\n=== Hidden Books in Alpha Circle: ${hiddenBooks?.length || 0} ===`)
  if (hiddenBooks && hiddenBooks.length > 0) {
    hiddenBooks.forEach(hb => {
      console.log(`  - ${hb.books.title} (owner: ${hb.books.profiles?.email})`)
    })
  } else {
    console.log('  (none)')
  }
  
  // Calculate visible books
  const hiddenBookIds = new Set(hiddenBooks?.map(hb => hb.book_id) || [])
  const visibleBooks = allBooks?.filter(b => !hiddenBookIds.has(b.id)) || []
  
  console.log(`\n=== Visible Books: ${visibleBooks.length} ===`)
  console.log(`(Total: ${allBooks?.length || 0} - Hidden: ${hiddenBooks?.length || 0} = ${visibleBooks.length})`)
  
  // Check for duplicates
  const seenISBNs = new Map()
  const seenTitleAuthor = new Map()
  
  for (const book of visibleBooks) {
    // We need to fetch ISBN to check for dupes
    const { data: fullBook } = await supabase
      .from('books')
      .select('isbn, author')
      .eq('id', book.id)
      .single()
    
    const key = fullBook?.isbn 
      ? `isbn:${fullBook.isbn}`
      : `title:${book.title.toLowerCase()}`
    
    if (seenISBNs.has(key)) {
      console.log(`  DUPLICATE: ${book.title} (${key})`)
    } else {
      seenISBNs.set(key, book.title)
    }
  }
  
  const uniqueCount = seenISBNs.size
  console.log(`\n=== After De-duplication: ${uniqueCount} unique books ===`)
}

debugAlphaCircle().catch(console.error)

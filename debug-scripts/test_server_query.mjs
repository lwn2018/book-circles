import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env.local') })

// Test with SERVICE ROLE (bypasses RLS)
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Simulate what the page component does
async function testServerQuery() {
  const alphaCircleId = '0fde346f-1ad0-4e6c-a736-1294a5b008e3'
  
  console.log('=== Simulating Server Query (Service Role) ===\n')
  
  // Get member IDs
  const { data: memberIds } = await serviceSupabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', alphaCircleId)
  
  const ownerIds = memberIds?.map(m => m.user_id) || []
  console.log('Circle member IDs:', ownerIds.length)
  
  // Get all books (exact same query as page.tsx)
  const { data: allBooks, error } = await serviceSupabase
    .from('books')
    .select(`
      id,
      title,
      author,
      isbn,
      cover_url,
      status,
      gift_on_borrow,
      owner_id,
      current_borrower_id,
      due_date,
      created_at,
      owner:owner_id (
        full_name
      ),
      current_borrower:current_borrower_id (
        full_name
      ),
      book_queue (
        id,
        user_id,
        position,
        pass_count,
        last_pass_reason,
        profiles (
          full_name
        )
      )
    `)
    .in('owner_id', ownerIds)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Query error:', error)
    return
  }
  
  console.log('Books returned from query:', allBooks?.length || 0)
  
  // Get hidden books
  const { data: hiddenBooks } = await serviceSupabase
    .from('book_circle_visibility')
    .select('book_id')
    .eq('circle_id', alphaCircleId)
    .eq('is_visible', false)
  
  const hiddenBookIds = new Set(hiddenBooks?.map(h => h.book_id) || [])
  console.log('Hidden books:', hiddenBooks?.length || 0)
  
  // Filter out hidden books
  const visibleBooks = allBooks?.filter(book => !hiddenBookIds.has(book.id)) || []
  console.log('Visible books:', visibleBooks.length)
  
  // De-duplicate (same logic as page.tsx)
  const seenBooks = new Map()
  const books = visibleBooks.filter(book => {
    const key = book.isbn 
      ? `isbn:${book.isbn}`
      : `title:${book.title.toLowerCase()}:author:${(book.author || '').toLowerCase()}`
    
    if (seenBooks.has(key)) {
      console.log('  DUPLICATE FOUND:', book.title)
      return false
    }
    
    seenBooks.set(key, book)
    return true
  })
  
  console.log('After de-duplication:', books.length)
  console.log('\n=== Books by Owner ===')
  
  const byOwner = {}
  for (const book of books) {
    const ownerName = book.owner?.full_name || 'Unknown'
    if (!byOwner[ownerName]) {
      byOwner[ownerName] = []
    }
    byOwner[ownerName].push(book.title)
  }
  
  for (const [owner, titles] of Object.entries(byOwner)) {
    console.log(`\n${owner}: ${titles.length} books`)
    titles.forEach(t => console.log(`  - ${t}`))
  }
}

testServerQuery().catch(console.error)

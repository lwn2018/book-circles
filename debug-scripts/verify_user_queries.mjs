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

async function verifyUserQueries() {
  const alphaCircleId = '0fde346f-1ad0-4e6c-a736-1294a5b008e3'
  
  console.log('=== Verifying What Each User Can See ===\n')
  
  // Get member IDs (what the page does)
  const { data: memberIds } = await supabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', alphaCircleId)
  
  const ownerIds = memberIds?.map(m => m.user_id) || []
  
  // Simulate the exact query from page.tsx
  const { data: allBooks } = await supabase
    .from('books')
    .select(`
      id,
      title,
      owner_id
    `)
    .in('owner_id', ownerIds)
    .order('created_at', { ascending: false })
  
  console.log(`Total books by members (service role): ${allBooks?.length}`)
  
  // Get visibility entries
  const { data: visibility } = await supabase
    .from('book_circle_visibility')
    .select('book_id, is_visible')
    .eq('circle_id', alphaCircleId)
  
  const visibleBookIds = new Set(
    visibility?.filter(v => v.is_visible).map(v => v.book_id) || []
  )
  
  console.log(`Books with is_visible=true: ${visibleBookIds.size}`)
  
  // Check which books are missing visibility entries
  const booksWithoutVisibility = allBooks?.filter(b => 
    !visibility?.some(v => v.book_id === b.id)
  ) || []
  
  console.log(`Books missing from book_circle_visibility: ${booksWithoutVisibility.length}`)
  if (booksWithoutVisibility.length > 0) {
    console.log('\nMissing books:')
    booksWithoutVisibility.forEach(b => console.log(`  - ${b.title}`))
  }
  
  // Check the RLS policy - what would a user see?
  console.log('\n=== RLS Policy Check ===')
  console.log('The RLS policy allows books if:')
  console.log('1. User owns the book (owner_id = auth.uid())')
  console.log('2. Book is in book_circle_visibility with is_visible=true AND user is in that circle')
  console.log('3. Book has circle_id column set (deprecated)')
  
  // For each book, check if it passes RLS for mathieu
  const mathieuId = '0d069c1d-08a8-44d1-bce4-972455fbc7c7'
  const testId = '4d9aad27-fd12-4918-948f-c7fcde416d92'
  
  for (const userId of [mathieuId, testId]) {
    const userName = userId === mathieuId ? 'mathieu@yuill.ca' : 'test@yuill.ca'
    
    const visibleToUser = allBooks?.filter(book => {
      // Condition 1: User owns it
      if (book.owner_id === userId) return true
      
      // Condition 2: Has visibility entry with is_visible=true
      if (visibleBookIds.has(book.id)) return true
      
      return false
    }) || []
    
    console.log(`\n${userName}: Can see ${visibleToUser.length} books (via RLS simulation)`)
  }
}

verifyUserQueries().catch(console.error)

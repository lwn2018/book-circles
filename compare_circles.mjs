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

async function compareCircles() {
  const alphaId = '0fde346f-1ad0-4e6c-a736-1294a5b008e3'
  const otherId = 'b67980a5-8afc-426d-a370-b920582d9b59'
  
  for (const circleId of [alphaId, otherId]) {
    console.log(`\n${'='.repeat(60)}`)
    
    // Get circle info
    const { data: circle } = await supabase
      .from('circles')
      .select('*')
      .eq('id', circleId)
      .single()
    
    console.log(`CIRCLE: ${circle?.name || 'Unknown'}`)
    console.log(`ID: ${circleId}`)
    
    // Get members
    const { data: members } = await supabase
      .from('circle_members')
      .select('user_id, profiles(email)')
      .eq('circle_id', circleId)
    
    console.log(`\nMembers: ${members?.length || 0}`)
    members?.forEach(m => console.log(`  - ${m.profiles.email}`))
    
    const memberIds = members?.map(m => m.user_id) || []
    
    // Get books
    const { data: allBooks } = await supabase
      .from('books')
      .select('id, title, owner_id, isbn, author')
      .in('owner_id', memberIds)
    
    console.log(`\nTotal books by members: ${allBooks?.length || 0}`)
    
    // Get hidden books
    const { data: hiddenBooks } = await supabase
      .from('book_circle_visibility')
      .select('book_id, books(title)')
      .eq('circle_id', circleId)
      .eq('is_visible', false)
    
    console.log(`Hidden books: ${hiddenBooks?.length || 0}`)
    if (hiddenBooks && hiddenBooks.length > 0) {
      hiddenBooks.forEach(h => console.log(`  - ${h.books?.title}`))
    }
    
    const hiddenBookIds = new Set(hiddenBooks?.map(h => h.book_id) || [])
    const visibleBooks = allBooks?.filter(b => !hiddenBookIds.has(b.id)) || []
    
    console.log(`Visible books: ${visibleBooks.length}`)
    
    // Check for duplicates
    const seenBooks = new Map()
    let dupeCount = 0
    
    for (const book of visibleBooks) {
      const key = book.isbn 
        ? `isbn:${book.isbn}`
        : `title:${book.title.toLowerCase()}:author:${(book.author || '').toLowerCase()}`
      
      if (seenBooks.has(key)) {
        console.log(`  DUPE: ${book.title}`)
        dupeCount++
      } else {
        seenBooks.set(key, book)
      }
    }
    
    console.log(`\nUnique books after deduplication: ${seenBooks.size}`)
    console.log(`Duplicates removed: ${dupeCount}`)
  }
}

compareCircles().catch(console.error)

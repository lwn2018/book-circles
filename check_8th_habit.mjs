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

async function check8thHabit() {
  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, isbn, owner_id, profiles!books_owner_id_fkey(email)')
    .ilike('title', '%8th habit%')
  
  console.log(`Found ${books?.length || 0} books matching "8th habit":\n`)
  
  for (const book of books || []) {
    console.log(`Title: "${book.title}"`)
    console.log(`Author: "${book.author || 'null'}"`)
    console.log(`ISBN: "${book.isbn || 'null'}"`)
    console.log(`Owner: ${book.profiles?.email}`)
    console.log(`ID: ${book.id}`)
    
    // Calculate the dedup key
    const key = book.isbn 
      ? `isbn:${book.isbn}`
      : `title:${book.title.toLowerCase()}:author:${(book.author || '').toLowerCase()}`
    
    console.log(`Dedup key: ${key}`)
    console.log('---\n')
  }
}

check8thHabit().catch(console.error)

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  console.log('🧪 Testing the user_can_see_book function directly...\n')
  
  // Get mathieu
  const { data: users } = await supabase.auth.admin.listUsers()
  const mathieu = users.users.find(u => u.email === 'mathieu@yuill.ca')
  
  // Get a book from Alpha Circle
  const { data: book } = await supabase
    .from('books')
    .select('id, title, owner_id')
    .limit(1)
    .single()
    
  console.log('Testing with book:', book.title)
  console.log('Book ID:', book.id)
  console.log('Mathieu ID:', mathieu.id)
  
  // Test the function directly
  const { data: canSee, error } = await supabase.rpc('user_can_see_book', {
    p_book_id: book.id,
    p_user_id: mathieu.id
  })
  
  console.log('\nFunction result:', canSee)
  console.log('Error:', error)
  
  // Also check if mathieu should see this book
  const { data: ownership } = await supabase
    .from('books')
    .select('owner_id')
    .eq('id', book.id)
    .single()
    
  console.log('\nBook owner:', ownership.owner_id)
  console.log('Is mathieu owner?', ownership.owner_id === mathieu.id)
  
  // Check visibility
  const { data: vis } = await supabase
    .from('book_circle_visibility')
    .select('circle_id, is_visible')
    .eq('book_id', book.id)
    
  console.log('\nVisibility entries:', vis)
  
  // Check mathieu's circles
  const { data: circles } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', mathieu.id)
    
  console.log('Mathieu circles:', circles)
}

test().catch(console.error)

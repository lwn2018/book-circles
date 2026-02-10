import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCircleBooks() {
  // Get Alpha Circle (find by name)
  const { data: circles } = await supabase
    .from('circles')
    .select('id, name')
    .ilike('name', '%Alpha%')
  
  console.log('Circles found:', circles)
  
  if (!circles || circles.length === 0) {
    console.log('No Alpha Circle found')
    return
  }
  
  const circleId = circles[0].id
  console.log(`\nChecking circle: ${circles[0].name} (${circleId})`)
  
  // Get circle members
  const { data: members } = await supabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', circleId)
  
  const ownerIds = members?.map(m => m.user_id) || []
  console.log(`\nCircle members: ${ownerIds.length}`)
  
  // Get all books owned by circle members
  const { data: allBooks } = await supabase
    .from('books')
    .select('id, title, owner_id, status')
    .in('owner_id', ownerIds)
    .order('created_at', { ascending: false })
  
  console.log(`\nTotal books owned by members: ${allBooks?.length || 0}`)
  
  // Get hidden books for this circle
  const { data: hiddenBooks } = await supabase
    .from('book_circle_visibility')
    .select('book_id')
    .eq('circle_id', circleId)
    .eq('is_visible', false)
  
  const hiddenBookIds = new Set(hiddenBooks?.map(h => h.book_id) || [])
  console.log(`\nHidden books: ${hiddenBookIds.size}`)
  
  // Filter out hidden books
  const visibleBooks = allBooks?.filter(book => !hiddenBookIds.has(book.id)) || []
  console.log(`\nVisible books: ${visibleBooks.length}`)
  
  // Show all visible books
  console.log('\n--- Visible Books ---')
  visibleBooks.forEach((book, idx) => {
    console.log(`${idx + 1}. ${book.title} (${book.status})`)
  })
  
  // Show hidden books if any
  if (hiddenBookIds.size > 0) {
    console.log('\n--- Hidden Books ---')
    const hidden = allBooks?.filter(book => hiddenBookIds.has(book.id)) || []
    hidden.forEach(book => {
      console.log(`- ${book.title} (${book.status})`)
    })
  }
}

checkCircleBooks().catch(console.error)

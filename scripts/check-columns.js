process.chdir('/home/clawdbot/clawd/book-circles');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Try to insert a test book to see the exact error
  console.log('Testing insert with minimal data...\n');
  
  const { data, error } = await supabase
    .from('books')
    .insert({
      title: 'TEST BOOK - DELETE ME',
      owner_id: '0d069c1d-08a8-44d1-bce4-972455fbc7c7', // Mathieu's ID
      status: 'available'
    })
    .select();

  if (error) {
    console.log('Insert error:', error.message);
    console.log('Full error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Insert succeeded!');
    console.log('Book:', data);
    
    // Clean up
    if (data && data[0]) {
      await supabase.from('books').delete().eq('id', data[0].id);
      console.log('Test book deleted');
    }
  }
}

main();

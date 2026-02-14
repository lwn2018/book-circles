process.chdir('/home/clawdbot/clawd/book-circles');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use anon key (like the browser would)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  // Check auth state
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  console.log('Current auth state:');
  console.log('User:', user ? user.id : 'NOT AUTHENTICATED');
  console.log('Auth error:', authError?.message || 'none');
  
  // Without auth, try to insert
  console.log('\nTrying insert without auth (should fail)...');
  const { data, error } = await supabase
    .from('books')
    .insert({
      title: 'TEST',
      owner_id: '0d069c1d-08a8-44d1-bce4-972455fbc7c7',
      status: 'available'
    })
    .select();

  console.log('Result:', error ? error.message : 'SUCCESS');
  
  // Check current INSERT policies
  console.log('\nRun this SQL in Supabase Dashboard:');
  console.log(`SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'books' AND cmd = 'INSERT';`);
}

main();

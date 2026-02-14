process.chdir('/home/clawdbot/clawd/book-circles');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Check RLS policies on books table
  const { data, error } = await supabase.rpc('exec', {
    query: `
      SELECT policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'books'
    `
  });

  if (error) {
    console.log('RPC not available, trying direct query...');
    
    // Try raw SQL via the REST API
    const { data: policies, error: polError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'books');
    
    if (polError) {
      console.log('Cannot query policies directly. Error:', polError.message);
      console.log('\nTry running this in Supabase SQL Editor:');
      console.log('SELECT * FROM pg_policies WHERE tablename = \'books\';');
    } else {
      console.log('Policies:', policies);
    }
  } else {
    console.log('RLS Policies on books table:');
    console.log(JSON.stringify(data, null, 2));
  }
}

main();

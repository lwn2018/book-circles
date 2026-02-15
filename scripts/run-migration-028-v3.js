// Run migration using supabase-js client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/clawdbot/clawd/book-circles/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('Running migration 028 - goodreads_library table...');
  
  // Create table
  const { error: tableError } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS goodreads_library (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        author TEXT,
        isbn TEXT,
        isbn13 TEXT,
        my_rating INTEGER,
        date_read TEXT,
        bookshelves TEXT,
        exclusive_shelf TEXT,
        imported_book_id UUID REFERENCES books(id) ON DELETE SET NULL,
        imported_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });

  if (tableError) {
    console.log('Table creation result:', tableError.message);
    // Try alternative - check if table already exists
    const { data, error: checkError } = await supabase
      .from('goodreads_library')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Table already exists!');
      return;
    }
    console.error('❌ Table creation failed and table does not exist');
    console.log('Please run the migration manually in Supabase Dashboard SQL Editor');
    return;
  }

  console.log('✅ Migration 028 completed!');
}

runMigration().catch(console.error);

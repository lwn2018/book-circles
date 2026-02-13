// Simple script to apply migration 027 using service role
const fs = require('fs');
const path = require('path');

// Read env
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

// The SQL to run
const sql = `
DROP FUNCTION IF EXISTS user_can_see_book(uuid, uuid);

CREATE OR REPLACE FUNCTION user_can_see_book(p_book_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM books b WHERE b.id = p_book_id AND b.owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM books b WHERE b.id = p_book_id AND b.current_borrower_id = p_user_id
  ) OR EXISTS (
    SELECT 1 
    FROM book_circle_visibility bcv
    INNER JOIN circle_members cm ON bcv.circle_id = cm.circle_id
    WHERE bcv.book_id = p_book_id
      AND bcv.is_visible = true
      AND cm.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
`;

// Use fetch to run via Supabase REST API (query endpoint)
async function runMigration() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(supabaseUrl, serviceKey);
  
  console.log('Applying migration 027...');
  
  // Execute the SQL - need to use the admin API
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (!response.ok) {
    console.error('Failed to run migration:', await response.text());
    console.log('\n❌ Could not apply via API.');
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
    console.log(sql);
    process.exit(1);
  }
  
  console.log('✅ Migration 027 applied successfully!');
}

runMigration().catch(err => {
  console.error('Error:', err.message);
  console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
  console.log(sql);
  process.exit(1);
});

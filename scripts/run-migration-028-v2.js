// Run migration using pg client
const { Pool } = require('pg');
require('dotenv').config({ path: '/home/clawdbot/clawd/book-circles/.env.local' });

// Construct DATABASE_URL from Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

// Supabase connection string format
const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

const sql = `
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

CREATE INDEX IF NOT EXISTS idx_goodreads_library_user ON goodreads_library(user_id);
CREATE INDEX IF NOT EXISTS idx_goodreads_library_imported ON goodreads_library(user_id, imported_book_id);

ALTER TABLE goodreads_library ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own goodreads library" ON goodreads_library FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own goodreads library" ON goodreads_library FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own goodreads library" ON goodreads_library FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own goodreads library" ON goodreads_library FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;

async function runMigration() {
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Running migration 028...');
    await client.query(sql);
    console.log('✅ Migration 028 completed successfully!');
    client.release();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();

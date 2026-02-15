const https = require('https');

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectId = 'lhxwvfqjdpsitrkrsoey';

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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, isbn13),
  UNIQUE(user_id, title, author)
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

const data = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${projectId}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e));
req.write(data);
req.end();

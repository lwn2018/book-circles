// Run migration via Supabase REST API using service role key
const https = require('https');

const supabaseUrl = 'lhxwvfqjdpsitrkrsoey.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

// Use the rpc endpoint to run raw SQL
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
`;

const data = JSON.stringify({ query: sql });

const options = {
  hostname: supabaseUrl,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration successful!');
    } else {
      console.log('Response:', body);
    }
  });
});

req.on('error', (e) => console.error('Error:', e));
req.write(data);
req.end();

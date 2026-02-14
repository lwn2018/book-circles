-- Setup covers storage bucket and RLS policies
-- Run once: psql "postgresql://postgres.kuwuymdqtkmljwqppvdz:${PAGEPASS_DB_PASSWORD}@aws-1-ca-central-1.pooler.supabase.com:6543/postgres" -f /home/clawdbot/clawd/book-circles/scripts/setup-covers-storage.sql

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Drop existing policies if they exist
DELETE FROM storage.policies WHERE bucket_id = 'covers';

-- Public read access
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Public read covers',
  'covers',
  'SELECT'
);

-- Authenticated write access  
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Authenticated write covers',
  'covers', 
  'INSERT'
);

-- Authenticated update access
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Authenticated update covers',
  'covers',
  'UPDATE'
);

-- Verify
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'covers';
SELECT name, bucket_id FROM storage.policies WHERE bucket_id = 'covers';

-- Create covers storage bucket and RLS policies
-- Run: psql "postgresql://postgres.kuwuymdqtkmljwqppvdz:${PAGEPASS_DB_PASSWORD}@aws-1-ca-central-1.pooler.supabase.com:6543/postgres" -f scripts/create-covers-bucket.sql

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

-- Check if policies exist and delete them
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'covers') THEN
    DELETE FROM storage.policies WHERE bucket_id = 'covers';
  END IF;
END $$;

-- Public read access
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Public read covers',
  'covers',
  'bucket_id = ''covers'''::text
);

-- Authenticated write access  
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Authenticated write covers',
  'covers', 
  'bucket_id = ''covers'' AND auth.role() = ''authenticated'''::text
);

-- Authenticated update access
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Authenticated update covers',
  'covers',
  'bucket_id = ''covers'' AND auth.role() = ''authenticated'''::text
);

-- Verify
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'covers';
SELECT name, bucket_id FROM storage.policies WHERE bucket_id = 'covers';

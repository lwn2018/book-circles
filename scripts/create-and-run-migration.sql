-- First, create a function that can execute DDL (run this in Supabase SQL Editor once)
CREATE OR REPLACE FUNCTION exec_ddl(ddl text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE ddl;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_ddl TO authenticated, service_role;

-- Now execute Migration 027
SELECT exec_ddl('ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn10 TEXT');
SELECT exec_ddl('ALTER TABLE books ADD COLUMN IF NOT EXISTS format TEXT');
SELECT exec_ddl('ALTER TABLE books ADD COLUMN IF NOT EXISTS publish_date TEXT');
SELECT exec_ddl('ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_source TEXT');
SELECT exec_ddl('ALTER TABLE books ADD COLUMN IF NOT EXISTS metadata_sources TEXT[]');
SELECT exec_ddl('ALTER TABLE books ADD COLUMN IF NOT EXISTS metadata_updated_at TIMESTAMPTZ');
SELECT exec_ddl('CREATE INDEX IF NOT EXISTS idx_books_cover_source ON books(cover_source)');
SELECT exec_ddl('CREATE INDEX IF NOT EXISTS idx_books_metadata_updated ON books(metadata_updated_at)');

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'books' 
AND column_name IN ('isbn10', 'format', 'publish_date', 'cover_source', 'metadata_sources', 'metadata_updated_at')
ORDER BY column_name;

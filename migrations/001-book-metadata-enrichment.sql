-- =====================================================
-- BOOK METADATA ENRICHMENT
-- Add columns for Google Books metadata
-- Supports publisher insights & better search/discovery
-- =====================================================

-- Add metadata columns if they don't exist
ALTER TABLE books ADD COLUMN IF NOT EXISTS genres text[];
ALTER TABLE books ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count integer;
ALTER TABLE books ADD COLUMN IF NOT EXISTS published_date text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publisher text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';
ALTER TABLE books ADD COLUMN IF NOT EXISTS google_books_id text;

-- Add index for genre queries (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_books_genres ON books USING gin(genres);

-- Add index for language filtering
CREATE INDEX IF NOT EXISTS idx_books_language ON books(language);

-- Add index for Google Books ID lookups
CREATE INDEX IF NOT EXISTS idx_books_google_id ON books(google_books_id);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check new columns exist:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'books' 
-- AND column_name IN ('genres', 'description', 'page_count', 'published_date', 'publisher', 'language', 'google_books_id');

-- Migration 027: Add metadata fields for ISBNdb integration
-- All columns nullable, no defaults, so existing rows unaffected

ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn10 TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS retail_price_cad DECIMAL(10,2);
ALTER TABLE books ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count INTEGER;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publish_date TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publisher TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_source TEXT; -- 'google', 'isbndb', 'openlibrary', 'placeholder'
ALTER TABLE books ADD COLUMN IF NOT EXISTS metadata_sources TEXT[]; -- array of sources that contributed data
ALTER TABLE books ADD COLUMN IF NOT EXISTS metadata_updated_at TIMESTAMPTZ;

-- Create index on cover_source for reporting queries
CREATE INDEX IF NOT EXISTS idx_books_cover_source ON books(cover_source);

-- Create index on metadata_updated_at for backfill queries
CREATE INDEX IF NOT EXISTS idx_books_metadata_updated ON books(metadata_updated_at);

-- =====================================================
-- UNIFIED BOOK SEARCH - Add Search Index
-- =====================================================

-- Add generated search vector column to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(author, '')), 'B')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS books_search_idx ON books USING gin(search_vector);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- After running, verify the index exists:
-- SELECT * FROM pg_indexes WHERE tablename = 'books' AND indexname = 'books_search_idx';

-- Test the search (replace 'habits' with any search term):
-- SELECT title, author, ts_rank(search_vector, websearch_to_tsquery('english', 'habits')) AS rank
-- FROM books
-- WHERE search_vector @@ websearch_to_tsquery('english', 'habits')
-- ORDER BY rank DESC
-- LIMIT 5;

-- =====================================================
-- Migration 022: Remove deprecated circle_id column
-- The book_circle_visibility table is now the primary system
-- circle_id column is no longer used
-- =====================================================

-- First, verify all books have visibility entries
-- (This is just informational, shouldn't block)
DO $$
DECLARE
  books_without_visibility INTEGER;
BEGIN
  SELECT COUNT(DISTINCT b.id)
  INTO books_without_visibility
  FROM books b
  LEFT JOIN book_circle_visibility bcv ON b.id = bcv.book_id
  WHERE bcv.book_id IS NULL;
  
  IF books_without_visibility > 0 THEN
    RAISE WARNING 'Warning: % books have no visibility entries. They may become invisible.', books_without_visibility;
  ELSE
    RAISE NOTICE 'All books have visibility entries. Safe to proceed.';
  END IF;
END $$;

-- Drop the deprecated circle_id column
ALTER TABLE books DROP COLUMN IF EXISTS circle_id;

-- Verification
COMMENT ON TABLE books IS 
'Book catalog. Visibility controlled via book_circle_visibility table (many-to-many with circles). Deprecated circle_id column removed in Migration 022.';

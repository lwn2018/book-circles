-- =====================================================
-- Migration 015: Backfill book_circle_visibility
-- Ensures all books owned by circle members have visibility entries
-- =====================================================

-- Insert missing visibility entries for all circles
-- This query finds all books owned by circle members
-- and creates visibility entries if they don't exist

INSERT INTO book_circle_visibility (book_id, circle_id, is_visible)
SELECT DISTINCT
  b.id as book_id,
  cm.circle_id,
  true as is_visible
FROM books b
JOIN circle_members cm ON b.owner_id = cm.user_id
WHERE NOT EXISTS (
  SELECT 1 
  FROM book_circle_visibility bcv 
  WHERE bcv.book_id = b.id 
    AND bcv.circle_id = cm.circle_id
)
ON CONFLICT (book_id, circle_id) DO NOTHING;

-- Verification query (commented out for migration):
-- SELECT 
--   c.name as circle_name,
--   COUNT(DISTINCT b.id) as total_books,
--   COUNT(DISTINCT bcv.book_id) as books_with_visibility
-- FROM circles c
-- JOIN circle_members cm ON cm.circle_id = c.id
-- JOIN books b ON b.owner_id = cm.user_id
-- LEFT JOIN book_circle_visibility bcv ON bcv.book_id = b.id AND bcv.circle_id = c.id
-- GROUP BY c.id, c.name
-- ORDER BY c.name;

-- =====================================================
-- BACKFILL: Create initial ownership records for existing books
-- =====================================================

-- Insert ownership records for all existing books
-- Each book gets an 'added' record showing the current owner added it
INSERT INTO book_ownership_history (book_id, owner_id, acquired_via, acquired_at)
SELECT 
  id,
  owner_id,
  'added',
  COALESCE(created_at, NOW())  -- Use created_at if available, otherwise now
FROM books
WHERE id NOT IN (
  SELECT book_id FROM book_ownership_history
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check all books have at least one ownership record:
-- SELECT 
--   COUNT(DISTINCT b.id) as total_books,
--   COUNT(DISTINCT boh.book_id) as books_with_history
-- FROM books b
-- LEFT JOIN book_ownership_history boh ON b.id = boh.book_id;

-- Show sample of ownership records:
-- SELECT 
--   b.title,
--   p.full_name as owner,
--   boh.acquired_via,
--   boh.acquired_at
-- FROM book_ownership_history boh
-- JOIN books b ON boh.book_id = b.id
-- JOIN profiles p ON boh.owner_id = p.id
-- ORDER BY boh.acquired_at DESC
-- LIMIT 10;

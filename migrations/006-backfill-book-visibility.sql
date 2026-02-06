-- =====================================================
-- BACKFILL: Create visibility entries for existing books
-- Makes all existing user books visible in all their circles
-- (Opt-out model: visible by default)
-- =====================================================

-- For each book, create visibility entries for all circles the owner is in
INSERT INTO book_circle_visibility (book_id, circle_id, is_visible)
SELECT DISTINCT 
  b.id as book_id,
  cm.circle_id,
  true as is_visible
FROM books b
JOIN circle_members cm ON cm.user_id = b.owner_id
WHERE NOT EXISTS (
  -- Don't create duplicates
  SELECT 1 FROM book_circle_visibility bcv 
  WHERE bcv.book_id = b.id 
  AND bcv.circle_id = cm.circle_id
)
ON CONFLICT (book_id, circle_id) DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check how many visibility entries were created:
-- SELECT COUNT(*) FROM book_circle_visibility;

-- Check visibility for a specific user's books (replace USER_ID):
-- SELECT b.title, c.name as circle_name, bcv.is_visible
-- FROM books b
-- JOIN book_circle_visibility bcv ON bcv.book_id = b.id
-- JOIN circles c ON c.id = bcv.circle_id
-- WHERE b.owner_id = 'YOUR_USER_ID'
-- ORDER BY b.title, c.name;

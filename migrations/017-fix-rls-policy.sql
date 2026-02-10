-- =====================================================
-- Migration 017: Fix RLS Policy to Use book_circle_visibility
-- The old policy checked books.circle_id (deprecated column)
-- New policy checks book_circle_visibility table (current model)
-- =====================================================

-- Drop the outdated policy
DROP POLICY IF EXISTS "Users can view accessible books" ON books;

-- Create corrected policy using book_circle_visibility
CREATE POLICY "Users can view accessible books"
ON books 
FOR SELECT 
USING (
  -- User owns the book
  owner_id = auth.uid()
  OR
  -- Book is visible in a circle the user belongs to
  EXISTS (
    SELECT 1 
    FROM book_circle_visibility bcv
    JOIN circle_members cm ON bcv.circle_id = cm.circle_id
    WHERE bcv.book_id = books.id
      AND bcv.is_visible = true
      AND cm.user_id = auth.uid()
  )
);

-- Verification query (run after migration):
-- SELECT 
--   b.id, b.title, p.email as owner,
--   COUNT(bcv.circle_id) FILTER (WHERE bcv.is_visible = true) as visible_circles
-- FROM books b
-- JOIN profiles p ON b.owner_id = p.id
-- LEFT JOIN book_circle_visibility bcv ON bcv.book_id = b.id
-- GROUP BY b.id, b.title, p.email
-- HAVING COUNT(bcv.circle_id) FILTER (WHERE bcv.is_visible = true) > 0
-- ORDER BY b.title;

-- =====================================================
-- FIX RLS: Support both old circle_id and new book_circle_visibility
-- Per CTO: Don't disable RLS, make policy work with both systems
-- =====================================================

-- Step 1: Backfill book_circle_visibility from old circle_id column
-- This ensures ALL books have visibility entries
INSERT INTO book_circle_visibility (book_id, circle_id, is_visible)
SELECT id, circle_id, true
FROM books
WHERE circle_id IS NOT NULL
  AND id NOT IN (SELECT book_id FROM book_circle_visibility)
ON CONFLICT (book_id, circle_id) DO NOTHING;

-- Step 2: Enable RLS if disabled
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view accessible books" ON books;
DROP POLICY IF EXISTS "Users can view books" ON books;
DROP POLICY IF EXISTS "Circle members can view books" ON books;
DROP POLICY IF EXISTS "Users can view own books" ON books;
DROP POLICY IF EXISTS "Users can view circle books" ON books;

-- Step 4: Create comprehensive policy that checks BOTH systems
CREATE POLICY "Users can view accessible books"
  ON books
  FOR SELECT
  TO authenticated
  USING (
    -- 1. User owns the book
    auth.uid() = owner_id
    OR
    -- 2. NEW SYSTEM: book_circle_visibility table
    id IN (
      SELECT bcv.book_id
      FROM book_circle_visibility bcv
      JOIN circle_members cm ON bcv.circle_id = cm.circle_id
      WHERE cm.user_id = auth.uid()
        AND bcv.is_visible = true
    )
    OR
    -- 3. OLD SYSTEM: circle_id column (backward compatibility)
    circle_id IN (
      SELECT circle_id
      FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check policy was created:
-- SELECT policyname FROM pg_policies WHERE tablename = 'books' AND policyname = 'Users can view accessible books';

-- Check RLS is enabled:
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'books';

-- Test as a user (replace USER_ID with actual user ID):
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = 'USER_ID_HERE';
-- SELECT COUNT(*) FROM books;
-- RESET ROLE;

-- Check backfill worked:
-- SELECT COUNT(*) FROM book_circle_visibility;

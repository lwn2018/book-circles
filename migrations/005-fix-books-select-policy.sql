-- =====================================================
-- FIX: Ensure users can SELECT their own books
-- Books added from search should be visible in library
-- =====================================================

-- Check existing SELECT policies
-- SELECT * FROM pg_policies WHERE tablename = 'books' AND cmd = 'SELECT';

-- Add policy for users to see their own books if it doesn't exist
DROP POLICY IF EXISTS "Users can view own books" ON books;

CREATE POLICY "Users can view own books"
  ON books
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Also ensure users can see books in their circles
DROP POLICY IF EXISTS "Users can view circle books" ON books;

CREATE POLICY "Users can view circle books"
  ON books
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM book_circle_visibility bcv
      JOIN circle_members cm ON cm.circle_id = bcv.circle_id
      WHERE bcv.book_id = books.id
        AND cm.user_id = auth.uid()
        AND bcv.is_visible = true
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check policies exist:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'books';

-- Test query (replace USER_ID with your actual user ID):
-- SELECT id, title, owner_id FROM books WHERE owner_id = 'YOUR_USER_ID';

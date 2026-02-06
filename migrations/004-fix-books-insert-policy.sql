-- =====================================================
-- FIX: Allow users to insert books they own
-- RLS policy for adding books from search
-- =====================================================

-- Policy: Users can insert books where they are the owner
CREATE POLICY IF NOT EXISTS "Users can insert own books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check policy exists:
-- SELECT * FROM pg_policies WHERE tablename = 'books' AND policyname = 'Users can insert own books';

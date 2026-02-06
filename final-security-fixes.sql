-- =====================================================
-- FINAL SECURITY FIXES - Apply These Remaining Issues
-- =====================================================

-- M4: Remove overly broad books UPDATE policy
-- Only owners and borrowers should be able to update books
DROP POLICY IF EXISTS "Circle members can update books" ON books;

-- M5: Fix book queue - users can only join queues for books in their circles
DROP POLICY IF EXISTS "Users can join queue" ON book_queue;

CREATE POLICY "Users can join queue for books in their circles"
  ON book_queue FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM books
      JOIN circle_members ON circle_members.circle_id = books.circle_id
      WHERE books.id = book_queue.book_id
      AND circle_members.user_id = auth.uid()
    )
  );

-- M6: Platform invites - Any user can create invite codes
-- Note: These are PLATFORM invites (to join the app), not circle invites
-- Circle joining uses circle.invite_code (different system)
-- Current policy is fine: users can create platform invites (word of mouth growth)

-- Verify the existing policy requires users to set their own ID:
-- "Users can create invites" should have WITH CHECK for created_by = auth.uid()
-- If not, add it:

DROP POLICY IF EXISTS "Users can create invites" ON invites;

CREATE POLICY "Users can create their own invites"
  ON invites FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- After running, verify:

-- 1. Check book policies (should only see owner + borrower UPDATE)
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'books' AND cmd = 'UPDATE';

-- 2. Check book_queue policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'book_queue';

-- 3. Check invites policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'invites';

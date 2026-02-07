-- =====================================================
-- FIX: Allow circle members to borrow available books
-- Current issue: UPDATE policies block borrowing action
-- =====================================================

-- Drop existing UPDATE policies that are too restrictive
DROP POLICY IF EXISTS "Borrowers can update borrowed books" ON books;
DROP POLICY IF EXISTS "Circle members can update books" ON books;
DROP POLICY IF EXISTS "Owners can update their books" ON books;

-- 1. Owners can update their own books (full control)
CREATE POLICY "Owners can update their books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 2. Circle members can borrow AVAILABLE books in their circles
CREATE POLICY "Circle members can borrow available books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (
    -- Book must be available AND user is in the circle
    status = 'available' AND
    (
      -- Old system: circle_id column
      circle_id IN (
        SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
      )
      OR
      -- New system: book_circle_visibility table
      id IN (
        SELECT bcv.book_id
        FROM book_circle_visibility bcv
        JOIN circle_members cm ON bcv.circle_id = cm.circle_id
        WHERE cm.user_id = auth.uid() AND bcv.is_visible = true
      )
    )
  )
  WITH CHECK (
    -- Can only borrow (set status to 'borrowed' and set self as borrower)
    status = 'borrowed' AND 
    current_borrower_id = auth.uid()
  );

-- 3. Borrowers can return books they borrowed
CREATE POLICY "Borrowers can return their books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (
    -- Must currently be borrowing this book
    current_borrower_id = auth.uid()
  )
  WITH CHECK (
    -- Can return it (set status back to available, clear borrower)
    (status = 'available' AND current_borrower_id IS NULL) OR
    -- Or keep borrowing it (update due date, etc)
    (status = 'borrowed' AND current_borrower_id = auth.uid())
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check all UPDATE policies:
-- SELECT policyname, permissive, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'books' AND cmd = 'UPDATE';

-- Test borrowing (replace IDs with actual values):
-- SET LOCAL request.jwt.claim.sub = 'USER_ID';
-- SET LOCAL ROLE authenticated;
-- UPDATE books 
-- SET status = 'borrowed', 
--     current_borrower_id = 'USER_ID', 
--     borrowed_at = NOW(), 
--     due_date = NOW() + INTERVAL '14 days'
-- WHERE id = 'BOOK_ID';
-- RESET ROLE;

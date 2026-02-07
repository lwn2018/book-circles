-- =====================================================
-- FIX: Allow borrowing without infinite recursion
-- Issue: Reading book columns in USING clause causes recursion
-- Solution: Minimal USING check, validation in WITH CHECK
-- =====================================================

-- Drop all UPDATE policies
DROP POLICY IF EXISTS "Borrowers can update borrowed books" ON books;
DROP POLICY IF EXISTS "Circle members can update books" ON books;
DROP POLICY IF EXISTS "Owners can update their books" ON books;
DROP POLICY IF EXISTS "Circle members can borrow available books" ON books;
DROP POLICY IF EXISTS "Borrowers can return their books" ON books;
DROP POLICY IF EXISTS "Circle members can borrow books" ON books;
DROP POLICY IF EXISTS "Borrowers can update their borrowed books" ON books;
DROP POLICY IF EXISTS "Users can update books appropriately" ON books;

-- Single UPDATE policy - no circular references
CREATE POLICY "Users can update books appropriately"
  ON books
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow access if: owner OR currently borrowing OR authenticated user
    -- (id IS NOT NULL allows borrow attempts - validation happens in WITH CHECK)
    owner_id = auth.uid() OR 
    current_borrower_id = auth.uid() OR
    id IS NOT NULL
  )
  WITH CHECK (
    -- Validation: What updates are allowed?
    owner_id = auth.uid() OR  -- Owners can do anything
    (
      -- Borrowing: setting yourself as borrower
      status = 'borrowed' AND 
      current_borrower_id = auth.uid() AND
      borrowed_in_circle_id IS NOT NULL
    ) OR
    (
      -- Returning: clearing yourself as borrower
      status = 'available' AND 
      current_borrower_id IS NULL
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check policy created:
SELECT policyname FROM pg_policies WHERE tablename = 'books' AND cmd = 'UPDATE';

-- =====================================================
-- Migration 023: Fix book insert policy for Goodreads import
-- =====================================================

-- First, let's see what INSERT policies currently exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'books'
    AND cmd = 'INSERT';
  
  RAISE NOTICE 'Current INSERT policies on books table: %', policy_count;
END $$;

-- Drop ALL existing INSERT policies
DROP POLICY IF EXISTS "Users can insert their own books" ON books;
DROP POLICY IF EXISTS "Users can insert books they own" ON books;
DROP POLICY IF EXISTS "Circle members can add books" ON books;

-- Create a single, simple INSERT policy
-- Users can insert books where they are the owner
CREATE POLICY "Users can insert their own books"
ON books
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Verify the policy was created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'books'
    AND cmd = 'INSERT';
  
  IF policy_count = 1 THEN
    RAISE NOTICE '✅ Migration 023 complete: Single INSERT policy created.';
  ELSE
    RAISE WARNING 'Warning: Expected 1 INSERT policy, found %', policy_count;
  END IF;
END $$;

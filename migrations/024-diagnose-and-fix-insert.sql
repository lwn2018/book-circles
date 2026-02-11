-- =====================================================
-- Migration 024: Diagnose and fix INSERT policy issues
-- =====================================================

-- Step 1: Show ALL policies on books table
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== ALL POLICIES ON BOOKS TABLE ===';
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'books'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE 'Policy: % | Command: % | Check: %', 
      policy_record.policyname, 
      policy_record.cmd,
      COALESCE(policy_record.with_check::text, 'none');
  END LOOP;
END $$;

-- Step 2: Drop ALL INSERT policies (be thorough)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'books' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON books', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Step 3: Create ONE simple INSERT policy
CREATE POLICY "Users can add books"
ON books
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Step 4: Verify result
DO $$
DECLARE
  insert_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO insert_policy_count
  FROM pg_policies
  WHERE tablename = 'books' AND cmd = 'INSERT';
  
  RAISE NOTICE '=== FINAL STATE ===';
  RAISE NOTICE 'INSERT policies on books table: %', insert_policy_count;
  
  IF insert_policy_count = 1 THEN
    RAISE NOTICE '✅ Migration 024 complete: Clean INSERT policy created.';
  ELSE
    RAISE WARNING '⚠️ Warning: Expected 1 INSERT policy, found %', insert_policy_count;
  END IF;
END $$;

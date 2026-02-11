-- =====================================================
-- Migration 025: Nuclear option - completely reset INSERT policy
-- =====================================================

-- Disable RLS temporarily to see all policies
SET SESSION AUTHORIZATION postgres;

-- Show what we're starting with
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== BEFORE: All policies on books ===';
  FOR policy_record IN 
    SELECT policyname, cmd, permissive
    FROM pg_policies
    WHERE tablename = 'books'
    ORDER BY cmd
  LOOP
    RAISE NOTICE '% | % | %', policy_record.cmd, policy_record.policyname, policy_record.permissive;
  END LOOP;
END $$;

-- Drop EVERY INSERT policy (loop through them all)
DO $$
DECLARE
  policy_name TEXT;
BEGIN
  FOR policy_name IN 
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'books' AND cmd = 'INSERT'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_name) || ' ON books';
    RAISE NOTICE 'Dropped: %', policy_name;
  END LOOP;
END $$;

-- Wait a moment
SELECT pg_sleep(0.5);

-- Create exactly ONE INSERT policy
CREATE POLICY "users_insert_own_books"
ON books
FOR INSERT
TO public
WITH CHECK (owner_id = auth.uid());

-- Verify final state
DO $$
DECLARE
  insert_count INTEGER;
  all_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO insert_count
  FROM pg_policies
  WHERE tablename = 'books' AND cmd = 'INSERT';
  
  SELECT COUNT(*) INTO all_count
  FROM pg_policies
  WHERE tablename = 'books';
  
  RAISE NOTICE '=== AFTER: Policy counts ===';
  RAISE NOTICE 'INSERT policies: %', insert_count;
  RAISE NOTICE 'Total policies: %', all_count;
  
  IF insert_count = 1 THEN
    RAISE NOTICE '✅ Migration 025 complete!';
  ELSE
    RAISE WARNING '⚠️ Still have % INSERT policies!', insert_count;
  END IF;
END $$;

-- Show final state
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== AFTER: All INSERT policies ===';
  FOR policy_record IN 
    SELECT policyname, with_check
    FROM pg_policies
    WHERE tablename = 'books' AND cmd = 'INSERT'
  LOOP
    RAISE NOTICE 'Policy: % | Check: %', policy_record.policyname, policy_record.with_check;
  END LOOP;
END $$;

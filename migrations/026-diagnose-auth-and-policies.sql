-- =====================================================
-- Migration 026: Deep diagnostic - auth + policies
-- =====================================================

-- 1. Check all policies on books table (including permissive/restrictive)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== ALL POLICIES ON BOOKS TABLE ===';
  FOR policy_record IN 
    SELECT 
      policyname, 
      cmd,
      permissive,
      roles,
      qual::text as using_clause,
      with_check::text as check_clause
    FROM pg_policies
    WHERE tablename = 'books'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE 'Name: % | Cmd: % | Type: % | Roles: %', 
      policy_record.policyname, 
      policy_record.cmd,
      policy_record.permissive,
      policy_record.roles;
    RAISE NOTICE '  USING: %', COALESCE(policy_record.using_clause, 'none');
    RAISE NOTICE '  CHECK: %', COALESCE(policy_record.check_clause, 'none');
    RAISE NOTICE '---';
  END LOOP;
END $$;

-- 2. Check if RLS is enabled
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'books';
  
  RAISE NOTICE '=== RLS STATUS ===';
  RAISE NOTICE 'RLS enabled on books table: %', rls_enabled;
END $$;

-- 3. Test auth.uid() function
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  RAISE NOTICE '=== AUTH TEST ===';
  RAISE NOTICE 'Current auth.uid(): %', COALESCE(current_user_id::text, 'NULL (not authenticated)');
END $$;

-- 4. Count policies by type
DO $$
DECLARE
  insert_permissive INT;
  insert_restrictive INT;
BEGIN
  SELECT COUNT(*) INTO insert_permissive
  FROM pg_policies
  WHERE tablename = 'books' 
    AND cmd = 'INSERT'
    AND permissive = 'PERMISSIVE';
  
  SELECT COUNT(*) INTO insert_restrictive
  FROM pg_policies
  WHERE tablename = 'books' 
    AND cmd = 'INSERT'
    AND permissive = 'RESTRICTIVE';
  
  RAISE NOTICE '=== POLICY COUNTS ===';
  RAISE NOTICE 'INSERT PERMISSIVE policies: %', insert_permissive;
  RAISE NOTICE 'INSERT RESTRICTIVE policies: %', insert_restrictive;
  
  IF insert_restrictive > 0 THEN
    RAISE WARNING '⚠️ RESTRICTIVE policies found! These block even when PERMISSIVE policies pass.';
  END IF;
END $$;

-- =====================================================
-- Migration 021: Fix RLS Using Security Definer Function
-- ✅ THIS IS THE FIX THAT WORKED (2026-02-10)
-- =====================================================
-- Problem: Migration 017 created an RLS policy with infinite recursion
-- Solution: Use a SECURITY DEFINER function to break the recursion
-- =====================================================

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can view accessible books" ON books;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS user_can_see_book(uuid, uuid);

-- Create helper function with proper parameter prefixes (p_)
-- This avoids ambiguous column references
CREATE OR REPLACE FUNCTION user_can_see_book(p_book_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    -- User owns the book
    SELECT 1 FROM books b WHERE b.id = p_book_id AND b.owner_id = p_user_id
  ) OR EXISTS (
    -- Book is visible in a circle the user belongs to
    SELECT 1 
    FROM book_circle_visibility bcv
    INNER JOIN circle_members cm ON bcv.circle_id = cm.circle_id
    WHERE bcv.book_id = p_book_id
      AND bcv.is_visible = true
      AND cm.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create policy using the function
CREATE POLICY "Users can view accessible books"
ON books 
FOR SELECT 
USING (user_can_see_book(id, auth.uid()));

-- =====================================================
-- Verification:
-- Books should now be visible to all users in their circles
-- Test: Visit app and check circle pages show all books
-- =====================================================

-- =====================================================
-- Migration 019: Fix Infinite Recursion in Books RLS Policy
-- The policy in 017 caused infinite recursion
-- This fixes it to avoid circular dependencies
-- =====================================================

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can view accessible books" ON books;

-- Create fixed policy WITHOUT recursion
-- Users can see books if:
-- 1. They own the book, OR
-- 2. The book is visible in a circle they belong to
CREATE POLICY "Users can view accessible books"
ON books 
FOR SELECT 
USING (
  -- User owns the book
  owner_id = auth.uid()
  OR
  -- Book is visible in a circle the user belongs to
  -- Use INNER JOIN to avoid recursion
  id IN (
    SELECT bcv.book_id
    FROM book_circle_visibility bcv
    INNER JOIN circle_members cm 
      ON bcv.circle_id = cm.circle_id 
      AND cm.user_id = auth.uid()
    WHERE bcv.is_visible = true
  )
);

-- Verification query (run after migration):
-- Test as a specific user:
-- SET LOCAL role = 'authenticated';
-- SET LOCAL request.jwt.claims = '{"sub": "<user-id>"}';
-- SELECT id, title FROM books LIMIT 5;

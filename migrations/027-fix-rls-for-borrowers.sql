-- =====================================================
-- Migration 027: Fix RLS to Allow Borrowers to See Books
-- =====================================================
-- Problem: Current RLS only allows owners + circle members to see books
-- Missing: Users who are BORROWING a book can't see it!
-- Solution: Add current_borrower_id check to the function
-- =====================================================

-- Drop and recreate the function with borrower check
DROP FUNCTION IF EXISTS user_can_see_book(uuid, uuid);

CREATE OR REPLACE FUNCTION user_can_see_book(p_book_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    -- User owns the book
    SELECT 1 FROM books b WHERE b.id = p_book_id AND b.owner_id = p_user_id
  ) OR EXISTS (
    -- User is currently borrowing the book
    SELECT 1 FROM books b WHERE b.id = p_book_id AND b.current_borrower_id = p_user_id
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

-- =====================================================
-- Verification:
-- Users should now see books on their shelf after borrowing
-- Test: Confirm a handoff, check shelf page shows the book
-- =====================================================

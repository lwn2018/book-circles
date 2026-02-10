-- =====================================================
-- Migration 020: Fix RLS with Non-Correlated Subquery
-- Migration 019 still had issues. This uses a simpler approach.
-- =====================================================

-- Drop ALL policies on books to start fresh
DROP POLICY IF EXISTS "Users can view accessible books" ON books;
DROP POLICY IF EXISTS "Users can insert their own books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Users can delete their own books" ON books;

-- Create SELECT policy using security definer function to avoid recursion
CREATE OR REPLACE FUNCTION user_can_see_book(book_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    -- User owns the book
    SELECT 1 FROM books WHERE id = book_id AND owner_id = user_id
  ) OR EXISTS (
    -- Book is visible in a circle the user belongs to
    SELECT 1 
    FROM book_circle_visibility bcv
    INNER JOIN circle_members cm ON bcv.circle_id = cm.circle_id
    WHERE bcv.book_id = book_id
      AND bcv.is_visible = true
      AND cm.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new SELECT policy using the function
CREATE POLICY "Users can view accessible books"
ON books 
FOR SELECT 
USING (user_can_see_book(id, auth.uid()));

-- Recreate other policies
CREATE POLICY "Users can insert their own books"
ON books
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own books"
ON books
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own books"
ON books
FOR DELETE
USING (owner_id = auth.uid());

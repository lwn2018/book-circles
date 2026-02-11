-- =====================================================
-- Migration 022 (Fixed): Remove deprecated circle_id column
-- First update all RLS policies that depend on it
-- Then drop the column
-- =====================================================

-- Step 1: Update policies on books table
-- These policies currently reference circle_id

-- Drop old policy: "Circle members can add books"
DROP POLICY IF EXISTS "Circle members can add books" ON books;

-- Create new policy: Users can insert their own books
CREATE POLICY "Users can insert their own books"
ON books
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- "Book owners can delete their books" - this one should be fine but let's recreate it
DROP POLICY IF EXISTS "Book owners can delete their books" ON books;

CREATE POLICY "Book owners can delete their books"
ON books
FOR DELETE
USING (owner_id = auth.uid());

-- Step 2: Update policies on book_queue table

-- Drop old policy: "Circle members can view queue"
DROP POLICY IF EXISTS "Circle members can view queue" ON book_queue;

-- Create new policy: Users can view queue for books they have access to
CREATE POLICY "Users can view queue for accessible books"
ON book_queue
FOR SELECT
USING (
  -- User can see queue if they have access to the book
  EXISTS (
    SELECT 1 FROM books b
    WHERE b.id = book_queue.book_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 
        FROM book_circle_visibility bcv
        INNER JOIN circle_members cm ON bcv.circle_id = cm.circle_id
        WHERE bcv.book_id = b.id
          AND bcv.is_visible = true
          AND cm.user_id = auth.uid()
      )
    )
  )
);

-- Drop old policy: "Users can join queue for books in their circles"
DROP POLICY IF EXISTS "Users can join queue for books in their circles" ON book_queue;

-- Create new policy: Users can join queue for accessible books
CREATE POLICY "Users can join queue for accessible books"
ON book_queue
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM books b
    WHERE b.id = book_queue.book_id
    AND EXISTS (
      SELECT 1 
      FROM book_circle_visibility bcv
      INNER JOIN circle_members cm ON bcv.circle_id = cm.circle_id
      WHERE bcv.book_id = b.id
        AND bcv.is_visible = true
        AND cm.user_id = auth.uid()
    )
  )
);

-- Step 3: Update policies on borrow_history table

-- Drop old policy: "Circle members can view history"
DROP POLICY IF EXISTS "Circle members can view history" ON borrow_history;

-- Create new policy: Users can view history for accessible books
CREATE POLICY "Users can view history for accessible books"
ON borrow_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM books b
    WHERE b.id = borrow_history.book_id
    AND (
      b.owner_id = auth.uid()
      OR
      borrower_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 
        FROM book_circle_visibility bcv
        INNER JOIN circle_members cm ON bcv.circle_id = cm.circle_id
        WHERE bcv.book_id = b.id
          AND bcv.is_visible = true
          AND cm.user_id = auth.uid()
      )
    )
  )
);

-- Step 4: Update policies on book_ownership_history table (if exists)

-- Drop old policy: "Users can view ownership history for accessible books"
DROP POLICY IF EXISTS "Users can view ownership history for accessible books" ON book_ownership_history;

-- Create new policy: Users can view ownership history for accessible books
CREATE POLICY "Users can view ownership history for accessible books"
ON book_ownership_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM books b
    WHERE b.id = book_ownership_history.book_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 
        FROM book_circle_visibility bcv
        INNER JOIN circle_members cm ON bcv.circle_id = cm.circle_id
        WHERE bcv.book_id = b.id
          AND bcv.is_visible = true
          AND cm.user_id = auth.uid()
      )
    )
  )
);

-- Step 5: Verify all books have visibility entries
DO $$
DECLARE
  books_without_visibility INTEGER;
BEGIN
  SELECT COUNT(DISTINCT b.id)
  INTO books_without_visibility
  FROM books b
  LEFT JOIN book_circle_visibility bcv ON b.id = bcv.book_id
  WHERE bcv.book_id IS NULL;
  
  IF books_without_visibility > 0 THEN
    RAISE WARNING 'Warning: % books have no visibility entries. Creating them now...', books_without_visibility;
    
    -- Create visibility entries for books that are missing them
    -- Make them visible in all circles their owner belongs to
    INSERT INTO book_circle_visibility (book_id, circle_id, is_visible)
    SELECT DISTINCT b.id, cm.circle_id, true
    FROM books b
    INNER JOIN circle_members cm ON cm.user_id = b.owner_id
    LEFT JOIN book_circle_visibility bcv ON bcv.book_id = b.id AND bcv.circle_id = cm.circle_id
    WHERE bcv.book_id IS NULL
    ON CONFLICT (book_id, circle_id) DO NOTHING;
    
    RAISE NOTICE 'Created visibility entries for missing books.';
  ELSE
    RAISE NOTICE 'All books have visibility entries. Safe to proceed.';
  END IF;
END $$;

-- Step 6: Now safe to drop the circle_id column
ALTER TABLE books DROP COLUMN circle_id;

-- Verification
COMMENT ON TABLE books IS 
'Book catalog. Visibility controlled via book_circle_visibility table. Deprecated circle_id column removed in Migration 022.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 022 complete: circle_id column removed and all policies updated.';
END $$;

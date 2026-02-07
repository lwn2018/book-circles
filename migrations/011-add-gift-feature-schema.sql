-- =====================================================
-- GIFT FEATURE: Add gift flag and ownership history
-- =====================================================

-- Step 1: Add gift flag to books table
ALTER TABLE books 
  ADD COLUMN IF NOT EXISTS gift_on_borrow boolean DEFAULT false;

-- Step 2: Create ownership history table
CREATE TABLE IF NOT EXISTS book_ownership_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES profiles(id) NOT NULL,
  acquired_via text NOT NULL CHECK (acquired_via IN (
    'added',              -- original owner added the book to their library
    'gift_transfer',      -- received as a gift from another user
    'future_type'         -- placeholder for any future acquisition types
  )),
  previous_owner_id uuid REFERENCES profiles(id),  -- null for original add
  circle_id uuid REFERENCES circles(id),            -- circle where transfer happened
  acquired_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz                               -- null = current owner
);

-- Step 3: Add indexes
CREATE INDEX IF NOT EXISTS idx_book_ownership_book_id 
  ON book_ownership_history(book_id);
CREATE INDEX IF NOT EXISTS idx_book_ownership_owner_id 
  ON book_ownership_history(owner_id);
CREATE INDEX IF NOT EXISTS idx_book_ownership_current 
  ON book_ownership_history(book_id) 
  WHERE ended_at IS NULL;

-- Step 4: Enable RLS
ALTER TABLE book_ownership_history ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policy for ownership history
-- Users can view ownership history for books they own or books in their circles
CREATE POLICY "Users can view ownership history for accessible books"
  ON book_ownership_history FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR book_id IN (
      SELECT bcv.book_id FROM book_circle_visibility bcv
      JOIN circle_members cm ON bcv.circle_id = cm.circle_id
      WHERE cm.user_id = auth.uid()
    )
    OR book_id IN (
      SELECT id FROM books 
      WHERE circle_id IN (
        SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check gift_on_borrow column added:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'books' AND column_name = 'gift_on_borrow';

-- Check ownership history table created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'book_ownership_history';

-- Check indexes:
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename = 'book_ownership_history';

-- Check RLS enabled:
-- SELECT relname, relrowsecurity 
-- FROM pg_class 
-- WHERE relname = 'book_ownership_history';

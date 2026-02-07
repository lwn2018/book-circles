-- =====================================================
-- OFF SHELF FEATURE: Add new status and tracking columns
-- =====================================================

-- Step 1: Add tracking columns
ALTER TABLE books 
  ADD COLUMN IF NOT EXISTS off_shelf_at timestamptz,
  ADD COLUMN IF NOT EXISTS off_shelf_return_status text;

-- Step 2: Add status constraint (includes existing + new status)
-- Drop existing constraint if it exists
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_status_check;

-- Add comprehensive status constraint
-- Current values: 'available', 'borrowed'
-- Adding: 'off_shelf' (and 'in_transit' for future gift feature)
ALTER TABLE books 
  ADD CONSTRAINT books_status_check 
  CHECK (status IN ('available', 'borrowed', 'off_shelf', 'in_transit'));

-- Step 3: Add index for off shelf queries
CREATE INDEX IF NOT EXISTS idx_books_off_shelf 
  ON books(owner_id, status) 
  WHERE status = 'off_shelf';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check constraint exists:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'books'::regclass AND conname = 'books_status_check';

-- Check columns added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'books' 
-- AND column_name IN ('off_shelf_at', 'off_shelf_return_status');

-- Check no books have invalid status:
-- SELECT DISTINCT status FROM books;

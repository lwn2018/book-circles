-- =====================================================
-- SOFT REMINDERS - Add tracking column
-- Tracks when the last "Still enjoying?" reminder was sent
-- =====================================================

-- Add column to track last soft reminder
ALTER TABLE books ADD COLUMN IF NOT EXISTS last_soft_reminder_at timestamptz;

-- Add index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_books_soft_reminder ON books(status, last_soft_reminder_at) 
WHERE status = 'borrowed';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check column exists:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'books' 
-- AND column_name = 'last_soft_reminder_at';

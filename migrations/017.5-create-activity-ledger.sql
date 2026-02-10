-- =====================================================
-- Migration 017.5: Create activity_ledger Table
-- This table was referenced in the code but never created
-- =====================================================

-- Create activity_ledger table
CREATE TABLE IF NOT EXISTS activity_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  event_type text, -- alias for action (some code uses this)
  metadata jsonb DEFAULT '{}'::jsonb,
  batch_id uuid, -- for grouping batch operations
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_ledger_user_id 
ON activity_ledger(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_ledger_book_id 
ON activity_ledger(book_id) 
WHERE book_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_ledger_batch_id 
ON activity_ledger(batch_id) 
WHERE batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_ledger_created_at 
ON activity_ledger(created_at DESC);

-- Enable RLS
ALTER TABLE activity_ledger ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own activity
CREATE POLICY "Users can view their own activity"
ON activity_ledger
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can insert their own activity
CREATE POLICY "Users can insert their own activity"
ON activity_ledger
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Add helpful comment
COMMENT ON TABLE activity_ledger IS 
'Log of user actions related to books (gifts, handoffs, etc.). Used for activity feeds and analytics.';

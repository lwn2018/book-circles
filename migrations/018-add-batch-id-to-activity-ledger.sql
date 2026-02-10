-- =====================================================
-- Migration 018: Add batch_id to activity_ledger
-- Enables grouping of batch handoff confirmations
-- =====================================================

-- Add batch_id column (nullable - only batch operations have it)
ALTER TABLE activity_ledger 
ADD COLUMN IF NOT EXISTS batch_id uuid;

-- Create index for faster batch queries
CREATE INDEX IF NOT EXISTS idx_activity_ledger_batch_id 
ON activity_ledger(batch_id) 
WHERE batch_id IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN activity_ledger.batch_id IS 
'UUID linking multiple activity entries that were part of a batch operation (e.g., batch handoff confirmation). NULL for single operations.';

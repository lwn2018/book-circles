-- =====================================================
-- ADD SOFT DELETE TO PROFILES
-- =====================================================

-- Add deleted_at column to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Create index for finding soft-deleted profiles
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at 
  ON profiles(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check column added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name = 'deleted_at';

-- =====================================================
-- HANDOFF SYSTEM: Two-party confirmation
-- =====================================================

-- Step 1: Add contact preference to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS contact_preference_type text CHECK (contact_preference_type IN ('phone', 'email', 'none')),
  ADD COLUMN IF NOT EXISTS contact_preference_value text;

-- Step 2: Update books status constraint to include 'in_transit'
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_status_check;
ALTER TABLE books 
  ADD CONSTRAINT books_status_check 
  CHECK (status IN ('available', 'borrowed', 'off_shelf', 'in_transit', 'ready_for_next'));

-- Step 3: Create handoff_confirmations table
CREATE TABLE IF NOT EXISTS handoff_confirmations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  giver_id uuid REFERENCES profiles(id) NOT NULL,
  receiver_id uuid REFERENCES profiles(id) NOT NULL,
  giver_confirmed_at timestamptz,
  receiver_confirmed_at timestamptz,
  both_confirmed_at timestamptz,
  reminder_48h_sent_at timestamptz,
  reminder_96h_sent_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Step 4: Add indexes
CREATE INDEX IF NOT EXISTS idx_handoff_pending 
  ON handoff_confirmations(book_id) 
  WHERE both_confirmed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_handoff_reminders 
  ON handoff_confirmations(created_at) 
  WHERE both_confirmed_at IS NULL;

-- Step 5: Enable RLS
ALTER TABLE handoff_confirmations ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS policy - users can see their own handoffs
CREATE POLICY "Users can view their handoff confirmations"
  ON handoff_confirmations FOR SELECT TO authenticated
  USING (
    auth.uid() = giver_id 
    OR auth.uid() = receiver_id
  );

-- Step 7: RLS policy - users can update their own confirmations
CREATE POLICY "Users can confirm their handoffs"
  ON handoff_confirmations FOR UPDATE TO authenticated
  USING (
    auth.uid() = giver_id 
    OR auth.uid() = receiver_id
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check contact preference columns added:
-- SELECT column_name, data_type 
-- FROM information_schema.columns
-- WHERE table_name = 'profiles' 
-- AND column_name LIKE 'contact_preference%';

-- Check status constraint updated:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'books'::regclass AND conname = 'books_status_check';

-- Check handoff_confirmations table exists:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'handoff_confirmations';

-- Check RLS enabled:
-- SELECT relname, relrowsecurity 
-- FROM pg_class 
-- WHERE relname = 'handoff_confirmations';

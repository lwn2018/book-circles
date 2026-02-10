-- =====================================================
-- BETA FEEDBACK TABLE
-- =====================================================

-- Create beta_feedback table
CREATE TABLE IF NOT EXISTS beta_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  page_url text NOT NULL,
  current_path text NOT NULL,
  device_info text,
  screen_size text,
  app_version text,
  feedback_type text CHECK (feedback_type IN ('bug', 'confusing', 'idea')),
  feedback_text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id 
  ON beta_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at 
  ON beta_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON beta_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Note: Only service role can SELECT (no policy for SELECT = service role only)

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check table created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'beta_feedback';

-- Check RLS enabled:
-- SELECT relname, relrowsecurity 
-- FROM pg_class 
-- WHERE relname = 'beta_feedback';

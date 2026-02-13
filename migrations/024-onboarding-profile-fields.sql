-- Migration 024: Onboarding Profile Fields
-- Add fields for avatar, onboarding completion, and Goodreads import tracking

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_type TEXT CHECK (avatar_type IN ('upload', 'preset', 'initials')) DEFAULT 'initials',
ADD COLUMN IF NOT EXISTS avatar_id TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_email_confirmed ON profiles(email_confirmed);

COMMENT ON COLUMN profiles.avatar_type IS 'Avatar type: upload (custom photo), preset (from gallery), or initials (default)';
COMMENT ON COLUMN profiles.avatar_id IS 'ID of preset avatar if avatar_type is preset';
COMMENT ON COLUMN profiles.avatar_url IS 'URL of uploaded avatar if avatar_type is upload';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN profiles.email_confirmed IS 'Whether user has confirmed their email address';

-- Goodreads imports table
CREATE TABLE IF NOT EXISTS goodreads_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  total_books INTEGER,
  imported_books INTEGER DEFAULT 0,
  failed_books INTEGER DEFAULT 0,
  error_message TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_goodreads_imports_user_id ON goodreads_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_goodreads_imports_status ON goodreads_imports(status);
CREATE INDEX IF NOT EXISTS idx_goodreads_imports_created_at ON goodreads_imports(created_at DESC);

COMMENT ON TABLE goodreads_imports IS 'Tracks Goodreads CSV import jobs and stores raw data for future re-imports';

-- RLS for goodreads_imports
ALTER TABLE goodreads_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own imports"
  ON goodreads_imports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own imports"
  ON goodreads_imports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imports"
  ON goodreads_imports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

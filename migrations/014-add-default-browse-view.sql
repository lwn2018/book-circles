-- Add default browse view preference to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS default_browse_view TEXT CHECK (default_browse_view IN ('card', 'list')) DEFAULT 'card';

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_default_browse_view ON profiles(default_browse_view);

-- Add comment
COMMENT ON COLUMN profiles.default_browse_view IS 'User preference for default browse view (card or list)';

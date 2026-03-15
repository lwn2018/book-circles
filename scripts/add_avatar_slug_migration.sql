-- Add avatar_slug column for illustrated avatars
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_slug TEXT DEFAULT 'marigold';

-- Update existing users who have no avatar to use default
UPDATE profiles
SET avatar_slug = 'marigold'
WHERE avatar_slug IS NULL;

-- Comment for documentation
COMMENT ON COLUMN profiles.avatar_slug IS 'Illustrated avatar slug: marigold, azure, blush, honey, rue, bumble';

-- Migration 026: Separate contact fields for multiple selection
-- Allows users to provide both email and phone for book handoffs

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Migrate existing data from old single-value system
UPDATE profiles
SET contact_email = contact_preference_value
WHERE contact_preference_type = 'email';

UPDATE profiles
SET contact_phone = contact_preference_value
WHERE contact_preference_type IN ('phone', 'text');

COMMENT ON COLUMN profiles.contact_email IS 'Email address for book handoff coordination';
COMMENT ON COLUMN profiles.contact_phone IS 'Phone number for book handoff coordination (calls or texts)';

-- Keep old columns for backward compatibility during migration
COMMENT ON COLUMN profiles.contact_preference_type IS 'DEPRECATED: Use contact_email and contact_phone instead';
COMMENT ON COLUMN profiles.contact_preference_value IS 'DEPRECATED: Use contact_email and contact_phone instead';

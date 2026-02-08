-- Add contact preference to profiles
-- Users can optionally share phone or email for handoff coordination

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS contact_preference_type TEXT CHECK (contact_preference_type IN ('phone', 'email', 'none')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS contact_preference_value TEXT;

-- Create index for querying
CREATE INDEX IF NOT EXISTS idx_profiles_contact_preference ON profiles(contact_preference_type);

-- Add comment
COMMENT ON COLUMN profiles.contact_preference_type IS 'How the user wants to be contacted for book handoffs: phone, email, or none';
COMMENT ON COLUMN profiles.contact_preference_value IS 'The actual phone number or email address (only shown during active handoffs)';

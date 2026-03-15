-- Add columns to control which contact info is shared with borrowers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_email boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_phone boolean DEFAULT false;

-- Update existing profiles to default values
UPDATE profiles SET share_email = true WHERE share_email IS NULL;
UPDATE profiles SET share_phone = false WHERE share_phone IS NULL;

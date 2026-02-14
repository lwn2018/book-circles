-- Allow anonymous users to look up circle info by invite code
-- This is needed for the signup flow to display the circle name
-- when a user arrives via an invite link

-- Create policy to allow anyone to read circle name and invite_code
-- (invite codes are public by nature - they're meant to be shared)
CREATE POLICY "Anyone can read circle info for invite validation"
  ON circles
  FOR SELECT
  USING (true);

-- Note: This only allows reading. Anonymous users still can't insert/update/delete

-- Founder's Circle Badge Award Script
-- DO NOT RUN until Mathieu provides the 18 beta tester email addresses
-- and approves execution close to beta launch (April 1, 2026)

-- Step 1: Set is_beta_tester flag on all beta testers
-- UPDATE profiles 
-- SET is_beta_tester = true 
-- WHERE email IN (
--   'email1@example.com',
--   'email2@example.com',
--   -- ... Mathieu to provide remaining emails
-- );

-- Step 2: Get the Founder's Circle badge_id
-- SELECT id FROM badges WHERE slug = 'founders_circle';
-- Result: [paste badge_id here]

-- Step 3: Award badge to all beta testers
-- INSERT INTO user_badges (user_id, badge_id, is_displayed, earned_at)
-- SELECT p.id, '[founders_circle_badge_id]', true, NOW()
-- FROM profiles p
-- WHERE p.is_beta_tester = true
-- ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Step 4: After beta ends, mark badge as no longer earnable
-- UPDATE badges SET is_earnable = false WHERE slug = 'founders_circle';

-- =================================================================
-- READY-TO-RUN VERSION (fill in the blanks):
-- =================================================================

-- When ready, uncomment and run:

/*
-- Ensure is_beta_tester column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_beta_tester boolean DEFAULT false;

-- Mark beta testers (FILL IN EMAILS)
UPDATE profiles 
SET is_beta_tester = true 
WHERE email IN (
  -- PASTE 18 EMAIL ADDRESSES HERE, comma-separated, in quotes
);

-- Award Founder's Circle badge
INSERT INTO user_badges (user_id, badge_id, is_displayed, earned_at)
SELECT 
  p.id, 
  (SELECT id FROM badges WHERE slug = 'founders_circle'),
  true, 
  NOW()
FROM profiles p
WHERE p.is_beta_tester = true
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Create notifications for badge recipients
INSERT INTO notifications (user_id, type, message, action_url, read, created_at)
SELECT 
  p.id,
  'badge_earned',
  'Welcome to the Founders Circle! Thank you for being an early supporter of PagePass.',
  '/settings',
  false,
  NOW()
FROM profiles p
WHERE p.is_beta_tester = true;
*/

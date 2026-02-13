-- Award Founder's Circle Badge to Beta Testers
-- Run this SQL in Supabase SQL Editor after deployment

-- Step 1: Get the badge ID
DO $$
DECLARE
  badge_uuid UUID;
  beta_tester_ids UUID[] := ARRAY[
    -- REPLACE THESE WITH ACTUAL USER IDs FROM YOUR DATABASE
    -- Get user IDs from: SELECT id, email FROM auth.users ORDER BY created_at LIMIT 18;
    
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000003'::UUID,
    '00000000-0000-0000-0000-000000000004'::UUID,
    '00000000-0000-0000-0000-000000000005'::UUID,
    '00000000-0000-0000-0000-000000000006'::UUID,
    '00000000-0000-0000-0000-000000000007'::UUID,
    '00000000-0000-0000-0000-000000000008'::UUID,
    '00000000-0000-0000-0000-000000000009'::UUID,
    '00000000-0000-0000-0000-000000000010'::UUID,
    '00000000-0000-0000-0000-000000000011'::UUID,
    '00000000-0000-0000-0000-000000000012'::UUID,
    '00000000-0000-0000-0000-000000000013'::UUID,
    '00000000-0000-0000-0000-000000000014'::UUID,
    '00000000-0000-0000-0000-000000000015'::UUID,
    '00000000-0000-0000-0000-000000000016'::UUID,
    '00000000-0000-0000-0000-000000000017'::UUID,
    '00000000-0000-0000-0000-000000000018'::UUID
  ];
  user_id UUID;
BEGIN
  -- Get Founder's Circle badge ID
  SELECT id INTO badge_uuid
  FROM badges
  WHERE slug = 'founders_circle';

  -- Award to each beta tester
  FOREACH user_id IN ARRAY beta_tester_ids
  LOOP
    INSERT INTO user_badges (user_id, badge_id, earned_at, is_displayed, metadata)
    VALUES (
      user_id,
      badge_uuid,
      NOW(),
      true,
      '{"beta_tester": true, "cohort": "founding_18"}'::jsonb
    )
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Founder''s Circle badges awarded to % users', array_length(beta_tester_ids, 1);
END $$;

-- Verify the awards
SELECT 
  ub.user_id,
  p.full_name,
  p.email,
  ub.earned_at,
  b.name as badge_name
FROM user_badges ub
JOIN badges b ON b.id = ub.badge_id
LEFT JOIN profiles p ON p.id = ub.user_id
WHERE b.slug = 'founders_circle'
ORDER BY ub.earned_at;

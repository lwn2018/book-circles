-- Identify First 18 Beta Testers
-- Run this in Supabase SQL Editor to get the list of founding users

SELECT 
  au.id,
  au.email,
  au.created_at,
  p.full_name,
  p.deleted_at
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.deleted_at IS NULL  -- Exclude deleted accounts
ORDER BY au.created_at ASC
LIMIT 18;

-- Export to use in award-founders-badge.sql
-- Copy the `id` values and replace the placeholder UUIDs

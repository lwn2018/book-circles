-- Get Alpha Circle ID
SELECT id, name FROM circles WHERE name LIKE '%Alpha%';

-- Get circle members
SELECT cm.user_id, p.email, p.full_name 
FROM circle_members cm
JOIN profiles p ON p.id = cm.user_id
WHERE cm.circle_id IN (SELECT id FROM circles WHERE name LIKE '%Alpha%');

-- Count books by owner in Alpha Circle
SELECT 
  b.owner_id,
  p.email,
  COUNT(*) as book_count
FROM books b
JOIN profiles p ON p.id = b.owner_id
WHERE b.owner_id IN (
  SELECT user_id FROM circle_members 
  WHERE circle_id IN (SELECT id FROM circles WHERE name LIKE '%Alpha%')
)
GROUP BY b.owner_id, p.email;

-- Check hidden books in Alpha Circle
SELECT 
  bcv.book_id,
  b.title,
  b.owner_id,
  p.email as owner_email,
  bcv.is_visible
FROM book_circle_visibility bcv
JOIN books b ON b.id = bcv.book_id
JOIN profiles p ON p.id = b.owner_id
WHERE bcv.circle_id IN (SELECT id FROM circles WHERE name LIKE '%Alpha%')
  AND bcv.is_visible = false;

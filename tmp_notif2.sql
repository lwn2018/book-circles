INSERT INTO notifications (user_id, type, message, read, created_at)
SELECT id, 'test', 'Test notification 1', false, now() FROM profiles WHERE email = 'mathieu@yuill.ca'
UNION ALL
SELECT id, 'test', 'Test notification 2', false, now() FROM profiles WHERE email = 'mathieu@yuill.ca'
UNION ALL
SELECT id, 'test', 'Test notification 3', false, now() FROM profiles WHERE email = 'mathieu@yuill.ca';

-- Get your user ID first
SELECT id, email FROM auth.users LIMIT 1;

-- Insert a test notification (replace USER_ID with your actual user ID)
INSERT INTO notifications (user_id, type, title, message, link, read)
VALUES (
  'USER_ID_HERE',
  'new_book',
  'Test Notification! ✨',
  'This is a test notification to see if the bell works. Click to go to your library.',
  '/library',
  false
);

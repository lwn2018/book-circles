-- =====================================================
-- DEBUG SEARCH ISSUE
-- =====================================================

-- 1. Check if search_vector column exists and has data
SELECT 
  id,
  title,
  author,
  owner_id,
  search_vector,
  length(search_vector::text) as vector_length
FROM books
LIMIT 5;

-- 2. Try raw search (bypass function)
SELECT 
  id,
  title,
  author,
  owner_id,
  ts_rank(search_vector, websearch_to_tsquery('english', 'atomic')) AS rank
FROM books
WHERE search_vector @@ websearch_to_tsquery('english', 'atomic')
ORDER BY rank DESC
LIMIT 10;

-- 3. Test search_my_books function with your user ID
-- Replace 'YOUR_USER_ID' with actual UUID from auth.users table
-- SELECT * FROM search_my_books('atomic', 'YOUR_USER_ID');

-- 4. Check if books exist at all
SELECT COUNT(*) as total_books FROM books;

-- 5. Check your books specifically (replace with your user ID)
-- SELECT id, title, author, status FROM books WHERE owner_id = 'YOUR_USER_ID';

-- 6. Check circle memberships (replace with your user ID)
-- SELECT * FROM circle_members WHERE user_id = 'YOUR_USER_ID';

-- 7. Test ILIKE fallback
SELECT 
  id,
  title,
  author,
  owner_id
FROM books
WHERE title ILIKE '%atomic%' OR author ILIKE '%atomic%'
LIMIT 10;

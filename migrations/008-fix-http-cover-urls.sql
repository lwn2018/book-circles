-- =====================================================
-- FIX: Upgrade HTTP cover URLs to HTTPS
-- Prevents browser console warnings about insecure content
-- =====================================================

-- Update books table
UPDATE books
SET cover_url = REPLACE(cover_url, 'http://', 'https://')
WHERE cover_url LIKE 'http://%';

-- Verify fix
SELECT COUNT(*) as books_with_http_urls
FROM books
WHERE cover_url LIKE 'http://%';
-- Should return 0

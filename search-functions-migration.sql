-- =====================================================
-- SEARCH DATABASE FUNCTIONS
-- =====================================================

-- Function: Search user's own books
CREATE OR REPLACE FUNCTION search_my_books(
  search_query text,
  user_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  author text,
  isbn text,
  cover_url text,
  status text,
  current_borrower_id uuid,
  rank real
) AS $$
BEGIN
  -- Try full-text search first
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.author,
    b.isbn,
    b.cover_url,
    b.status,
    b.current_borrower_id,
    ts_rank(b.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM books b
  WHERE b.owner_id = user_id
    AND b.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT 20;

  -- If no results, try fuzzy match with ILIKE
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      b.id,
      b.title,
      b.author,
      b.isbn,
      b.cover_url,
      b.status,
      b.current_borrower_id,
      0.5::real AS rank
    FROM books b
    WHERE b.owner_id = user_id
      AND (
        b.title ILIKE '%' || search_query || '%'
        OR b.author ILIKE '%' || search_query || '%'
      )
    ORDER BY b.title
    LIMIT 20;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Search books in user's circles (not owned by them)
CREATE OR REPLACE FUNCTION search_circle_books(
  search_query text,
  user_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  author text,
  isbn text,
  cover_url text,
  status text,
  owner_id uuid,
  owner_name text,
  circle_id uuid,
  circle_name text,
  rank real
) AS $$
BEGIN
  -- Try full-text search first
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.author,
    b.isbn,
    b.cover_url,
    b.status,
    b.owner_id,
    owner.full_name AS owner_name,
    b.circle_id,
    c.name AS circle_name,
    ts_rank(b.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM books b
  JOIN profiles owner ON b.owner_id = owner.id
  JOIN circles c ON b.circle_id = c.id
  JOIN circle_members cm ON cm.circle_id = c.id
  WHERE cm.user_id = user_id
    AND b.owner_id != user_id
    AND b.search_vector @@ websearch_to_tsquery('english', search_query)
    -- Respect visibility (opt-out model)
    AND NOT EXISTS (
      SELECT 1 FROM book_circle_visibility bcv
      WHERE bcv.book_id = b.id
        AND bcv.circle_id = c.id
        AND bcv.is_visible = false
    )
  ORDER BY rank DESC
  LIMIT 20;

  -- If no results, try fuzzy match with ILIKE
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      b.id,
      b.title,
      b.author,
      b.isbn,
      b.cover_url,
      b.status,
      b.owner_id,
      owner.full_name AS owner_name,
      b.circle_id,
      c.name AS circle_name,
      0.5::real AS rank
    FROM books b
    JOIN profiles owner ON b.owner_id = owner.id
    JOIN circles c ON b.circle_id = c.id
    JOIN circle_members cm ON cm.circle_id = c.id
    WHERE cm.user_id = user_id
      AND b.owner_id != user_id
      AND (
        b.title ILIKE '%' || search_query || '%'
        OR b.author ILIKE '%' || search_query || '%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM book_circle_visibility bcv
        WHERE bcv.book_id = b.id
          AND bcv.circle_id = c.id
          AND bcv.is_visible = false
      )
    ORDER BY b.title
    LIMIT 20;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test search_my_books:
-- SELECT * FROM search_my_books('habits', auth.uid());

-- Test search_circle_books:
-- SELECT * FROM search_circle_books('habits', auth.uid());

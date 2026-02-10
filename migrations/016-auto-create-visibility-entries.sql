-- =====================================================
-- Migration 016: Auto-create book_circle_visibility entries
-- When a book is added, automatically create visibility entries
-- for all circles the owner belongs to
-- =====================================================

-- Create function to auto-populate visibility entries
CREATE OR REPLACE FUNCTION create_book_visibility_entries()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert visibility entries for all circles the book owner is a member of
  INSERT INTO book_circle_visibility (book_id, circle_id, is_visible)
  SELECT 
    NEW.id as book_id,
    cm.circle_id,
    true as is_visible
  FROM circle_members cm
  WHERE cm.user_id = NEW.owner_id
  ON CONFLICT (book_id, circle_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (idempotent)
DROP TRIGGER IF EXISTS auto_create_book_visibility ON books;

-- Create trigger on books INSERT
CREATE TRIGGER auto_create_book_visibility
  AFTER INSERT ON books
  FOR EACH ROW
  EXECUTE FUNCTION create_book_visibility_entries();

-- Also handle when users join circles - create visibility for their books
CREATE OR REPLACE FUNCTION create_visibility_for_member_books()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user joins a circle, create visibility entries for all their books
  INSERT INTO book_circle_visibility (book_id, circle_id, is_visible)
  SELECT 
    b.id as book_id,
    NEW.circle_id,
    true as is_visible
  FROM books b
  WHERE b.owner_id = NEW.user_id
  ON CONFLICT (book_id, circle_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (idempotent)
DROP TRIGGER IF EXISTS auto_create_visibility_on_join ON circle_members;

-- Create trigger on circle_members INSERT
CREATE TRIGGER auto_create_visibility_on_join
  AFTER INSERT ON circle_members
  FOR EACH ROW
  EXECUTE FUNCTION create_visibility_for_member_books();

-- Verification (commented out):
-- Test by inserting a book or adding a member to a circle
-- Then check book_circle_visibility table

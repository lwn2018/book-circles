-- Create goodreads_library table for storing parsed Goodreads CSV data
-- This allows users to return and import more books without re-uploading

CREATE TABLE IF NOT EXISTS goodreads_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text,
  isbn text,
  isbn13 text,
  my_rating integer,
  date_read text,
  bookshelves text,
  exclusive_shelf text,
  imported_book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  imported_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique constraint for upsert - use title+author as fallback for books without ISBN
CREATE UNIQUE INDEX IF NOT EXISTS goodreads_library_user_isbn13_idx 
  ON goodreads_library(user_id, isbn13) WHERE isbn13 IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS goodreads_library_user_title_author_idx 
  ON goodreads_library(user_id, title, author) WHERE isbn13 IS NULL;

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS goodreads_library_user_id_idx ON goodreads_library(user_id);

-- RLS policies
ALTER TABLE goodreads_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goodreads library"
  ON goodreads_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goodreads library"
  ON goodreads_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goodreads library"
  ON goodreads_library FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goodreads library"
  ON goodreads_library FOR DELETE
  USING (auth.uid() = user_id);

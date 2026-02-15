-- Store parsed Goodreads CSV data per user for "Import more" feature
CREATE TABLE IF NOT EXISTS goodreads_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Book data from CSV
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  isbn13 TEXT,
  my_rating INTEGER,
  date_read TEXT,
  bookshelves TEXT,
  exclusive_shelf TEXT,
  -- Import tracking
  imported_book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  imported_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One entry per book per user (by title+author combo as fallback if no ISBN)
  UNIQUE(user_id, isbn13),
  UNIQUE(user_id, title, author)
);

-- Index for fast lookups
CREATE INDEX idx_goodreads_library_user ON goodreads_library(user_id);
CREATE INDEX idx_goodreads_library_imported ON goodreads_library(user_id, imported_book_id);

-- RLS policies
ALTER TABLE goodreads_library ENABLE ROW LEVEL SECURITY;

-- Users can only see their own library
CREATE POLICY "Users can view own goodreads library"
  ON goodreads_library FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own books
CREATE POLICY "Users can insert own goodreads library"
  ON goodreads_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own books
CREATE POLICY "Users can update own goodreads library"
  ON goodreads_library FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own books
CREATE POLICY "Users can delete own goodreads library"
  ON goodreads_library FOR DELETE
  USING (auth.uid() = user_id);

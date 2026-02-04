-- Migration: Books belong to users, visible to multiple circles
-- This refactors from "books belong to circles" to "books belong to users, visible in circles"

-- Step 1: Create book_circle_visibility table
CREATE TABLE IF NOT EXISTS public.book_circle_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(book_id, circle_id)
);

-- Enable RLS
ALTER TABLE public.book_circle_visibility ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see visibility settings for books in their circles
CREATE POLICY "Users can view visibility in their circles"
  ON public.book_circle_visibility
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.circle_members
      WHERE circle_members.circle_id = book_circle_visibility.circle_id
      AND circle_members.user_id = auth.uid()
    )
  );

-- Policy: Book owners can manage visibility
CREATE POLICY "Owners can manage book visibility"
  ON public.book_circle_visibility
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = book_circle_visibility.book_id
      AND books.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = book_circle_visibility.book_id
      AND books.owner_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_book_circle_visibility_book ON public.book_circle_visibility(book_id);
CREATE INDEX IF NOT EXISTS idx_book_circle_visibility_circle ON public.book_circle_visibility(circle_id);

-- Step 2: Add borrowed_in_circle_id to track which circle a book is currently borrowed in
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS borrowed_in_circle_id uuid REFERENCES public.circles(id);

CREATE INDEX IF NOT EXISTS idx_books_borrowed_in_circle ON public.books(borrowed_in_circle_id);

-- Step 3: Migrate existing books to new model
-- For each existing book with a circle_id, create a visibility entry
INSERT INTO public.book_circle_visibility (book_id, circle_id, is_visible)
SELECT id, circle_id, true
FROM public.books
WHERE circle_id IS NOT NULL
ON CONFLICT (book_id, circle_id) DO NOTHING;

-- Step 4: Set borrowed_in_circle_id for currently borrowed books
UPDATE public.books
SET borrowed_in_circle_id = circle_id
WHERE status = 'borrowed' AND circle_id IS NOT NULL;

-- Step 5: Make circle_id nullable (books no longer "belong" to one circle)
-- Note: We keep the column for backward compatibility but it's no longer required
ALTER TABLE public.books ALTER COLUMN circle_id DROP NOT NULL;

-- Optional: Add a comment to clarify the new model
COMMENT ON COLUMN public.books.circle_id IS 'DEPRECATED: Use book_circle_visibility table instead. Kept for backward compatibility.';
COMMENT ON COLUMN public.books.borrowed_in_circle_id IS 'Tracks which circle a book is currently borrowed in (if status=borrowed).';

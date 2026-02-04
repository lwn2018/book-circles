-- Allow borrowers to update books they're currently borrowing
-- This is needed for "Ready to Pass On" functionality

-- First, let's see what policies exist
-- You can run this in Supabase SQL editor to check

-- Drop and recreate books update policy
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Borrowers can update borrowed books" ON public.books;

-- Policy 1: Owners can update their own books
CREATE POLICY "Owners can update their books"
  ON public.books
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Policy 2: Current borrowers can update status/next_recipient (for pass-on flow)
CREATE POLICY "Borrowers can update borrowed books"
  ON public.books
  FOR UPDATE
  USING (current_borrower_id = auth.uid())
  WITH CHECK (current_borrower_id = auth.uid());

-- Allow borrowers to read books they're borrowing
DROP POLICY IF EXISTS "Users can view books in their circles" ON public.books;

CREATE POLICY "Users can view books in their circles"
  ON public.books
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    current_borrower_id = auth.uid() OR
    next_recipient = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.circle_members
      WHERE circle_members.circle_id = books.circle_id
      AND circle_members.user_id = auth.uid()
    )
  );

-- Allow queue updates
DROP POLICY IF EXISTS "Users can update their queue entries" ON public.book_queue;

CREATE POLICY "Users can update their queue entries"
  ON public.book_queue
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow queue inserts
DROP POLICY IF EXISTS "Users can join queues" ON public.book_queue;

CREATE POLICY "Users can join queues"
  ON public.book_queue
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow queue deletes
DROP POLICY IF EXISTS "Users can leave queues" ON public.book_queue;

CREATE POLICY "Users can leave queues"
  ON public.book_queue
  FOR DELETE
  USING (user_id = auth.uid());

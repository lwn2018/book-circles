-- Add queue-related columns to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS next_recipient uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS ready_for_pass_on_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS owner_recall_active boolean DEFAULT false;

-- Add columns to book_queue if they don't exist
ALTER TABLE public.book_queue
ADD COLUMN IF NOT EXISTS pass_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_pass_reason text,
ADD COLUMN IF NOT EXISTS last_pass_date timestamp with time zone;

-- Create index for faster queue lookups
CREATE INDEX IF NOT EXISTS idx_book_queue_book_position ON public.book_queue(book_id, position);
CREATE INDEX IF NOT EXISTS idx_books_next_recipient ON public.books(next_recipient);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_url text,
  metadata jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own notifications
CREATE POLICY "Users can read own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: System can insert notifications (authenticated users)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

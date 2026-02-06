-- =====================================================
-- PURCHASE CLICKS TRACKING
-- Track every "Buy on Amazon" click with rich context
-- Powers conversion analytics & future bookseller partnerships
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  book_id uuid REFERENCES books(id),                  -- null if we only have ISBN
  isbn text,
  book_title text NOT NULL,
  book_author text,
  click_context text NOT NULL CHECK (click_context IN (
    'unavailable_to_borrow',       -- book not in any circle
    'post_read_buy_own_copy',      -- user already read/borrowed this book
    'browsing_recommendation',     -- general browsing or recommendation
    'gift_purchase',               -- buying as a gift
    'post_pagepass_self',          -- post-handoff completion screen (for self)
    'post_pagepass_gift'           -- post-handoff completion screen (as gift)
  )),
  previously_borrowed boolean DEFAULT false,           -- did this user borrow this book before?
  circle_id uuid REFERENCES circles(id),               -- which circle they were browsing (if any)
  search_query text,                                   -- what they searched for (if from search)
  affiliate_tag text DEFAULT 'pagepass-20',
  affiliate_url text NOT NULL,                         -- the full Amazon URL we sent them to
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_user_id ON purchase_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_book_id ON purchase_clicks(book_id);
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_book_title ON purchase_clicks(book_title);
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_context ON purchase_clicks(click_context);
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_created_at ON purchase_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_clicks_previously_borrowed ON purchase_clicks(previously_borrowed);

-- Enable RLS
ALTER TABLE purchase_clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own purchase clicks only
CREATE POLICY "Users can view own purchase clicks"
  ON purchase_clicks FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert (logging from server)
-- No user-facing INSERT policy needed - all inserts via API with service role

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check table exists:
-- SELECT * FROM purchase_clicks LIMIT 1;

-- Check policies:
-- SELECT * FROM pg_policies WHERE tablename = 'purchase_clicks';

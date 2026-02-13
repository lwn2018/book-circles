-- Migration 023: Gamification Infrastructure
-- Creates tables for event tracking, badges, and stats

-- Add retail_price_cad to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS retail_price_cad DECIMAL(10,2);
COMMENT ON COLUMN books.retail_price_cad IS 'Retail/list price in CAD captured at time of book addition';

-- User events table for tracking all gamification-relevant actions
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_type ON user_events(event_type);
CREATE INDEX idx_user_events_timestamp ON user_events(timestamp DESC);
CREATE INDEX idx_user_events_metadata ON user_events USING gin(metadata);

COMMENT ON TABLE user_events IS 'Tracks all user activity for gamification stats and badges';

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('lending', 'borrowing', 'circle', 'impact', 'time', 'special')),
  icon_url TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('automatic', 'manual')),
  trigger_condition JSONB DEFAULT '{}'::jsonb,
  is_earnable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_badges_slug ON badges(slug);
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_is_earnable ON badges(is_earnable);

COMMENT ON TABLE badges IS 'Collectible achievement badges users can earn';

-- User badges (earned badges per user)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);
CREATE INDEX idx_user_badges_displayed ON user_badges(user_id, is_displayed) WHERE is_displayed = true;

COMMENT ON TABLE user_badges IS 'Tracks which badges each user has earned and which they display';

-- RLS Policies for user_events
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON user_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert events
CREATE POLICY "Service role can insert events"
  ON user_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for badges (public read)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  USING (true);

-- RLS Policies for user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own earned badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their displayed badge"
  ON user_badges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert user_badges
CREATE POLICY "Service role can award badges"
  ON user_badges FOR INSERT
  WITH CHECK (true);

-- Insert all pre-defined badges
INSERT INTO badges (slug, name, description, category, trigger_type, trigger_condition, is_earnable) VALUES
-- Lending category
('first_share', 'First Share', 'Lent your first book', 'lending', 'automatic', '{"event": "book_lent", "count": 1}', true),
('generous_reader', 'Generous Reader', 'Lent 5 books', 'lending', 'automatic', '{"event": "book_lent", "count": 5}', true),
('neighborhood_library', 'Neighborhood Library', 'Lent 15 books', 'lending', 'automatic', '{"event": "book_lent", "count": 15}', true),
('the_librarian', 'The Librarian', 'Lent 50 books', 'lending', 'automatic', '{"event": "book_lent", "count": 50}', true),
('books_in_motion_5', 'Books in Motion: 5', 'Have 5 books out simultaneously', 'lending', 'automatic', '{"event": "books_in_motion", "count": 5}', true),
('books_in_motion_10', 'Books in Motion: 10', 'Have 10 books out simultaneously', 'lending', 'automatic', '{"event": "books_in_motion", "count": 10}', true),

-- Borrowing category
('first_borrow', 'First Borrow', 'Borrowed your first book', 'borrowing', 'automatic', '{"event": "book_borrowed", "count": 1}', true),
('bookworm', 'Bookworm', 'Borrowed 10 books', 'borrowing', 'automatic', '{"event": "book_borrowed", "count": 10}', true),
('voracious', 'Voracious', 'Borrowed 25 books', 'borrowing', 'automatic', '{"event": "book_borrowed", "count": 25}', true),
('quick_return', 'Quick Return', 'Returned a book within 7 days', 'borrowing', 'automatic', '{"event": "book_returned", "days_held": 7}', true),

-- Circle category
('circle_starter', 'Circle Starter', 'Created your first circle', 'circle', 'automatic', '{"event": "circle_created", "count": 1}', true),
('community_builder', 'Community Builder', 'Created 3 circles', 'circle', 'automatic', '{"event": "circle_created", "count": 3}', true),
('the_connector', 'The Connector', 'Invited 1 person who joined', 'circle', 'automatic', '{"event": "invite_converted", "count": 1}', true),
('super_connector', 'Super Connector', 'Invited 5 people who joined', 'circle', 'automatic', '{"event": "invite_converted", "count": 5}', true),
('inner_circle', 'Inner Circle', 'Member of a circle with 10+ people', 'circle', 'automatic', '{"event": "circle_joined", "member_count": 10}', true),

-- Impact category
('shared_100', '$100 Club', 'Shared $100+ worth of books', 'impact', 'automatic', '{"event": "value_shared", "amount": 100}', true),
('shared_500', '$500 Club', 'Shared $500+ worth of books', 'impact', 'automatic', '{"event": "value_shared", "amount": 500}', true),
('shared_1000', '$1,000 Club', 'Shared $1,000+ worth of books', 'impact', 'automatic', '{"event": "value_shared", "amount": 1000}', true),
('book_traveler', 'Book Traveler', 'Own a book read by 5+ people', 'impact', 'automatic', '{"event": "book_readers", "count": 5}', true),
('globe_trotter', 'Globe Trotter', 'Own a book read by 10+ people', 'impact', 'automatic', '{"event": "book_readers", "count": 10}', true),

-- Time category
('top_lender_month', 'Top Lender', 'Most books lent in a circle this month', 'time', 'automatic', '{"event": "monthly_top_lender"}', true),
('top_borrower_month', 'Top Borrower', 'Most books borrowed in a circle this month', 'time', 'automatic', '{"event": "monthly_top_borrower"}', true),
('streak_30', '30-Day Streak', 'Books in motion for 30 consecutive days', 'time', 'automatic', '{"event": "lending_streak", "days": 30}', true),
('streak_90', '90-Day Streak', 'Books in motion for 90 consecutive days', 'time', 'automatic', '{"event": "lending_streak", "days": 90}', true),
('streak_365', '365-Day Streak', 'Books in motion for 365 consecutive days', 'time', 'automatic', '{"event": "lending_streak", "days": 365}', true),

-- Special category
('founders_circle', 'Founder''s Circle', 'Beta tester - first 18 users', 'special', 'manual', '{}', false),
('early_adopter', 'Early Adopter', 'Joined in first year', 'special', 'automatic', '{"event": "signup_date", "before": "2027-04-01"}', true),
('supporter', 'Supporter', 'Active premium subscriber', 'special', 'manual', '{}', true),
('gift_giver', 'Gift Giver', 'Gifted 1 book to someone', 'special', 'automatic', '{"event": "book_gifted", "count": 1}', true),
('secret_santa', 'Secret Santa', 'Gifted 5 books', 'special', 'automatic', '{"event": "book_gifted", "count": 5}', true)
ON CONFLICT (slug) DO NOTHING;

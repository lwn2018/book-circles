-- Migration 031: Add Report & Block User functionality
-- Part of App Store compliance requirements

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES profiles(id) NOT NULL,
  reported_user_id uuid REFERENCES profiles(id) NOT NULL,
  reason text NOT NULL,
  details text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for filtering by status (admin review)
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Index for preventing duplicate reports
CREATE INDEX IF NOT EXISTS idx_reports_reporter_reported ON reports(reporter_id, reported_user_id);

-- RLS for reports: Users can INSERT their own reports, but cannot SELECT
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can only insert reports where they are the reporter
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- No SELECT policy - users cannot view reports (admin only via service role)

-- ============================================
-- BLOCKED USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid REFERENCES profiles(id) NOT NULL,
  blocked_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(blocker_id, blocked_id)
);

-- Index for filtering by blocker
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);

-- Index for filtering by blocked user
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- RLS for blocked_users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can insert blocks where they are the blocker
CREATE POLICY "Users can block others" ON blocked_users
  FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

-- Users can view their own blocks (both as blocker and blocked)
CREATE POLICY "Users can view blocks involving them" ON blocked_users
  FOR SELECT
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid());

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can unblock" ON blocked_users
  FOR DELETE
  USING (blocker_id = auth.uid());

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_created ON analytics_events(user_id, created_at);

-- Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Insert default settings
INSERT INTO admin_settings (key, value) VALUES 
  ('ads_enabled', 'true'::jsonb),
  ('affiliate_links_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Analytics: Users can insert their own events
CREATE POLICY "Users can insert their own analytics events"
  ON analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Analytics: Admins can view all
CREATE POLICY "Admins can view all analytics events"
  ON analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admin Settings: Public can read ads_enabled, admins can read all
CREATE POLICY "Public can read ads_enabled setting"
  ON admin_settings
  FOR SELECT
  USING (key = 'ads_enabled');

CREATE POLICY "Admins can read all settings"
  ON admin_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update settings"
  ON admin_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Add is_admin column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Analytics helper functions
CREATE OR REPLACE FUNCTION get_dau()
RETURNS bigint AS $$
  SELECT COUNT(DISTINCT user_id)
  FROM analytics_events
  WHERE created_at >= CURRENT_DATE;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_wau()
RETURNS bigint AS $$
  SELECT COUNT(DISTINCT user_id)
  FROM analytics_events
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_mau()
RETURNS bigint AS $$
  SELECT COUNT(DISTINCT user_id)
  FROM analytics_events
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
$$ LANGUAGE sql STABLE;

-- Fix: Allow everyone to read affiliate settings (they're public anyway)
-- These settings are not sensitive - they appear in the URLs that users click

-- Drop the old narrow policy
DROP POLICY IF EXISTS "Public can read ads_enabled setting" ON admin_settings;

-- Create new broader policy for all public affiliate settings
CREATE POLICY "Public can read affiliate settings"
  ON admin_settings FOR SELECT
  USING (
    key IN (
      'ads_enabled',
      'indigo_affiliate_id',
      'amazon_associate_tag',
      'amazon_ca_associate_tag',
      'affiliate_priority'
    )
  );

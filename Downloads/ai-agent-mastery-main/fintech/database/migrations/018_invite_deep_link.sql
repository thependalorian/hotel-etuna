-- Migration 018: Invite Deep Link Tracking
-- Location: backend/migrations/018_invite_deep_link.sql
-- Purpose: Track invite code clicks and attribution for analytics
-- Date: 2026-03-16

-- ============================================================================
-- INVITE CLICKS TABLE
-- ============================================================================
-- Tracks when invite links are clicked for analytics and fraud prevention

CREATE TABLE IF NOT EXISTS invite_clicks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invite tracking
  invite_code           VARCHAR(10) NOT NULL,
  inviter_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Click metadata
  ip_address            INET,
  user_agent            TEXT,
  referrer              TEXT,
  
  -- Device and location info
  device_info           JSONB DEFAULT '{}',
  country_code          VARCHAR(2),
  
  -- Conversion tracking
  registered            BOOLEAN DEFAULT false,
  registered_user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  registered_at         TIMESTAMPTZ,
  
  -- Timestamps
  clicked_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invite_clicks_code ON invite_clicks(invite_code, clicked_at DESC);
CREATE INDEX idx_invite_clicks_inviter ON invite_clicks(inviter_user_id) WHERE inviter_user_id IS NOT NULL;
CREATE INDEX idx_invite_clicks_registered ON invite_clicks(registered, clicked_at DESC);
CREATE INDEX idx_invite_clicks_registered_user ON invite_clicks(registered_user_id) WHERE registered_user_id IS NOT NULL;
CREATE INDEX idx_invite_clicks_ip ON invite_clicks(ip_address);
CREATE INDEX idx_invite_clicks_clicked_at ON invite_clicks(clicked_at DESC);

-- ============================================================================
-- INVITE STATS TABLE (MATERIALIZED VIEW)
-- ============================================================================
-- Pre-computed invite statistics for fast dashboard queries

CREATE TABLE IF NOT EXISTS invite_stats (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  invite_code           VARCHAR(10) NOT NULL,
  
  -- Click statistics
  total_clicks          INTEGER NOT NULL DEFAULT 0,
  unique_ips            INTEGER NOT NULL DEFAULT 0,
  
  -- Conversion statistics
  total_registrations   INTEGER NOT NULL DEFAULT 0,
  conversion_rate       NUMERIC(5,2) DEFAULT 0.00,
  
  -- Latest activity
  last_click_at         TIMESTAMPTZ,
  last_registration_at  TIMESTAMPTZ,
  
  -- Timestamps
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invite_stats_code ON invite_stats(invite_code);
CREATE INDEX idx_invite_stats_registrations ON invite_stats(total_registrations DESC);
CREATE INDEX idx_invite_stats_conversion ON invite_stats(conversion_rate DESC);

-- ============================================================================
-- FUNCTION TO UPDATE INVITE STATS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_invite_stats()
RETURNS TRIGGER AS $$
DECLARE
  inviter_id UUID;
  invite_code_val VARCHAR(10);
BEGIN
  -- Get inviter user ID from invite code
  SELECT id, invite_code INTO inviter_id, invite_code_val
  FROM users 
  WHERE invite_code = NEW.invite_code
  LIMIT 1;
  
  IF inviter_id IS NOT NULL THEN
    -- Insert or update invite stats
    INSERT INTO invite_stats (
      user_id,
      invite_code,
      total_clicks,
      unique_ips,
      total_registrations,
      last_click_at,
      last_registration_at
    )
    VALUES (
      inviter_id,
      invite_code_val,
      1,
      1,
      CASE WHEN NEW.registered THEN 1 ELSE 0 END,
      NEW.clicked_at,
      CASE WHEN NEW.registered THEN NEW.registered_at ELSE NULL END
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_clicks = invite_stats.total_clicks + 1,
      unique_ips = (
        SELECT COUNT(DISTINCT ip_address) 
        FROM invite_clicks 
        WHERE invite_clicks.invite_code = invite_stats.invite_code
      ),
      total_registrations = CASE 
        WHEN NEW.registered THEN invite_stats.total_registrations + 1 
        ELSE invite_stats.total_registrations 
      END,
      conversion_rate = CASE 
        WHEN invite_stats.total_clicks + 1 > 0 
        THEN ((invite_stats.total_registrations + CASE WHEN NEW.registered THEN 1 ELSE 0 END)::NUMERIC / (invite_stats.total_clicks + 1)::NUMERIC) * 100
        ELSE 0 
      END,
      last_click_at = GREATEST(invite_stats.last_click_at, NEW.clicked_at),
      last_registration_at = CASE 
        WHEN NEW.registered THEN GREATEST(COALESCE(invite_stats.last_registration_at, NEW.registered_at), NEW.registered_at)
        ELSE invite_stats.last_registration_at 
      END,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when invite click is inserted or updated
DROP TRIGGER IF EXISTS trigger_update_invite_stats ON invite_clicks;
CREATE TRIGGER trigger_update_invite_stats
  AFTER INSERT OR UPDATE ON invite_clicks
  FOR EACH ROW
  EXECUTE FUNCTION update_invite_stats();

-- ============================================================================
-- INITIALIZE INVITE STATS FOR EXISTING USERS
-- ============================================================================

-- Create initial stats for all users with invite codes
INSERT INTO invite_stats (user_id, invite_code, total_clicks, unique_ips, total_registrations)
SELECT 
  id,
  invite_code,
  0,
  0,
  0
FROM users
WHERE invite_code IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Migration complete

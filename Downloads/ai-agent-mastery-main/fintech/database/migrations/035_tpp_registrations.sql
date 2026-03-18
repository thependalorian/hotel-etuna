-- Migration: 035_tpp_registrations.sql
-- Purpose: OBS v1.0 §6.2 - Third-Party Provider (TPP) registration and authorization tracking
-- Priority: HIGH
-- Date: 2026-03-17

-- ============================================================================
-- TPP REGISTRATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tpp_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- TPP identification
  tpp_name VARCHAR(100) NOT NULL,
  tpp_code VARCHAR(20) NOT NULL UNIQUE,
  legal_entity_name VARCHAR(200) NOT NULL,
  registration_number VARCHAR(50) NOT NULL,
  
  -- TPP type
  tpp_type VARCHAR(20) NOT NULL CHECK (tpp_type IN (
    'aisp',      -- Account Information Service Provider
    'pisp',      -- Payment Initiation Service Provider
    'both'       -- Both AISP and PISP
  )),
  
  -- Authorization status
  authorization_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (authorization_status IN (
    'pending',      -- Application submitted, awaiting BoN approval
    'authorized',   -- Authorized by BoN to operate
    'suspended',    -- Temporarily suspended by BoN
    'revoked',      -- Authorization revoked
    'expired'       -- Authorization expired
  )),
  
  -- Authorization details
  bon_license_number VARCHAR(50),
  bon_authorized_at TIMESTAMPTZ,
  authorization_expires_at TIMESTAMPTZ,
  authorized_services TEXT[] DEFAULT '{}',
  
  -- Technical details
  client_id VARCHAR(100) NOT NULL UNIQUE,
  redirect_uris TEXT[] NOT NULL,
  webhook_url TEXT,
  public_key_pem TEXT,
  
  -- Contact information
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  website_url TEXT,
  
  -- Compliance
  bon_compliance_certificate VARCHAR(100),
  last_compliance_review_date DATE,
  next_compliance_review_date DATE,
  
  -- Activity tracking
  total_users_connected INTEGER DEFAULT 0,
  total_api_calls BIGINT DEFAULT 0,
  total_consent_count INTEGER DEFAULT 0,
  last_api_call_at TIMESTAMPTZ,
  
  -- Risk and monitoring
  risk_rating VARCHAR(20) CHECK (risk_rating IN ('low', 'medium', 'high')),
  security_incident_count INTEGER DEFAULT 0,
  last_security_incident_at TIMESTAMPTZ,
  
  -- Status changes
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tpp_status ON tpp_registrations(authorization_status);
CREATE INDEX idx_tpp_type ON tpp_registrations(tpp_type, authorization_status);
CREATE INDEX idx_tpp_expiry ON tpp_registrations(authorization_expires_at) 
  WHERE authorization_status = 'authorized';

-- ============================================================================
-- TPP ACTIVITY SUMMARY VIEW
-- ============================================================================
CREATE OR REPLACE VIEW vw_tpp_activity_summary AS
SELECT
  t.id,
  t.tpp_name,
  t.tpp_code,
  t.tpp_type,
  t.authorization_status,
  t.total_users_connected,
  t.total_api_calls,
  t.last_api_call_at,
  COUNT(DISTINCT c.user_id) AS active_consent_count,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.user_id END) AS current_active_users
FROM tpp_registrations t
LEFT JOIN obs_consents c ON c.data_provider_id IN (
  SELECT id FROM data_providers WHERE provider_code = t.tpp_code
)
GROUP BY t.id, t.tpp_name, t.tpp_code, t.tpp_type, t.authorization_status, 
         t.total_users_connected, t.total_api_calls, t.last_api_call_at;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_tpp_registrations_updated_at
  BEFORE UPDATE ON tpp_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tpp_registrations IS 'OBS v1.0 §6.2: Third-Party Provider registration and authorization tracking for BoN compliance';
COMMENT ON VIEW vw_tpp_activity_summary IS 'TPP activity summary with consent and user connection metrics';

-- Migration complete

-- Migration: 029_security_incidents.sql
-- Purpose: PSD-12 §2.3 - Security incident classification and response tracking
-- Priority: CRITICAL
-- Date: 2026-03-17

-- ============================================================================
-- SECURITY INCIDENTS TABLE
-- ============================================================================
-- System-wide security incident tracking (PSD-12 §2.3)
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Incident identification
  incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN (
    'data_breach',              -- Unauthorized access to user data
    'system_intrusion',         -- Network/server compromise
    'ddos_attack',              -- Distributed denial of service
    'malware_detected',         -- Malware/ransomware infection
    'phishing_campaign',        -- Phishing attack against users
    'insider_threat',           -- Employee/contractor malicious activity
    'api_abuse',                -- API rate limiting violation
    'unauthorized_access',      -- Unauthorized login attempt
    'data_exfiltration',        -- Data theft detected
    'credential_stuffing',      -- Bulk credential testing
    'sql_injection',            -- SQL injection attempt
    'xss_attack',               -- Cross-site scripting
    'session_hijacking',        -- Session token theft
    'privilege_escalation',     -- Unauthorized privilege gain
    'configuration_error',      -- Security misconfiguration
    'other'
  )),
  
  -- Severity classification (PSD-12 §2.3)
  severity VARCHAR(20) NOT NULL CHECK (severity IN (
    'critical',    -- System-wide impact, immediate BoN notification required
    'high',        -- Multiple users affected, 24h BoN notification
    'medium',      -- Limited user impact, 48h BoN notification
    'low'          -- No user impact, monthly BoN reporting
  )),
  
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',           -- Incident detected, investigation ongoing
    'investigating',  -- Root cause analysis in progress
    'contained',      -- Threat contained, remediation in progress
    'resolved',       -- Incident fully resolved
    'monitoring',     -- Post-resolution monitoring
    'closed'          -- Incident closed and documented
  )),
  
  -- Detection
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detection_method VARCHAR(50) CHECK (detection_method IN (
    'automated_alert',
    'user_report',
    'security_scan',
    'audit_review',
    'external_notification',
    'threat_intelligence',
    'manual_discovery'
  )),
  detected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Impact assessment
  affected_users_count INTEGER DEFAULT 0,
  affected_user_ids UUID[],
  data_compromised BOOLEAN NOT NULL DEFAULT false,
  data_categories TEXT[],  -- e.g., ['pii', 'financial', 'credentials']
  estimated_loss NUMERIC(15,2) DEFAULT 0,
  
  -- Response timeline
  acknowledged_at TIMESTAMPTZ,
  contained_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- Response time tracking (for KRI)
  time_to_detection_minutes INTEGER,
  time_to_containment_minutes INTEGER,
  time_to_resolution_minutes INTEGER,
  
  -- Response team
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  response_team TEXT[],
  
  -- Root cause analysis
  root_cause TEXT,
  attack_vector TEXT,
  attack_source_ip INET,
  attack_source_country VARCHAR(2),
  
  -- Remediation
  remediation_actions TEXT,
  preventive_measures TEXT,
  
  -- BoN notification (PSD-12 §2.3 - critical incidents require immediate notification)
  bon_notification_required BOOLEAN NOT NULL DEFAULT false,
  bon_notified_at TIMESTAMPTZ,
  bon_reference VARCHAR(50),
  bon_report_submitted BOOLEAN NOT NULL DEFAULT false,
  
  -- Law enforcement
  law_enforcement_notified BOOLEAN NOT NULL DEFAULT false,
  law_enforcement_notified_at TIMESTAMPTZ,
  police_case_number VARCHAR(50),
  
  -- Evidence and logs
  evidence_stored BOOLEAN NOT NULL DEFAULT false,
  evidence_location TEXT,
  related_logs JSONB DEFAULT '{}',
  
  -- Public disclosure
  public_disclosure_required BOOLEAN NOT NULL DEFAULT false,
  disclosed_at TIMESTAMPTZ,
  disclosure_statement TEXT,
  
  -- Metadata
  description TEXT NOT NULL,
  notes TEXT,
  tags TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_security_incidents_severity_status ON security_incidents(severity, status, detected_at DESC);
CREATE INDEX idx_security_incidents_type_date ON security_incidents(incident_type, detected_at DESC);
CREATE INDEX idx_security_incidents_status ON security_incidents(status, detected_at DESC);
CREATE INDEX idx_security_incidents_bon_pending ON security_incidents(bon_notification_required, bon_notified_at) 
  WHERE bon_notification_required = true AND bon_notified_at IS NULL;
CREATE INDEX idx_security_incidents_open ON security_incidents(severity, detected_at DESC) 
  WHERE status IN ('open', 'investigating', 'contained');

-- ============================================================================
-- INCIDENT RESPONSE ACTIONS TABLE
-- ============================================================================
-- Tracks individual actions taken during incident response
CREATE TABLE IF NOT EXISTS incident_response_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES security_incidents(id) ON DELETE CASCADE,
  
  -- Action details
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'investigation_started',
    'evidence_collected',
    'system_isolated',
    'threat_contained',
    'patch_applied',
    'credentials_reset',
    'users_notified',
    'bon_notified',
    'law_enforcement_contacted',
    'remediation_complete',
    'monitoring_initiated',
    'post_mortem_completed',
    'other'
  )),
  description TEXT NOT NULL,
  
  -- Actor
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Results
  outcome TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incident_actions_incident ON incident_response_actions(incident_id, performed_at DESC);
CREATE INDEX idx_incident_actions_type ON incident_response_actions(action_type, performed_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Critical incidents requiring immediate attention
CREATE OR REPLACE VIEW vw_critical_incidents AS
SELECT
  id,
  incident_type,
  severity,
  status,
  detected_at,
  affected_users_count,
  data_compromised,
  bon_notification_required,
  bon_notified_at,
  assigned_to,
  description
FROM security_incidents
WHERE status IN ('open', 'investigating', 'contained')
  AND severity IN ('critical', 'high')
ORDER BY 
  CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 END,
  detected_at ASC;

-- Incident response time metrics (for KRI)
CREATE OR REPLACE VIEW vw_incident_response_metrics AS
SELECT
  DATE(detected_at) AS incident_date,
  severity,
  COUNT(*) AS incident_count,
  AVG(time_to_detection_minutes) AS avg_time_to_detection,
  AVG(time_to_containment_minutes) AS avg_time_to_containment,
  AVG(time_to_resolution_minutes) AS avg_time_to_resolution,
  COUNT(CASE WHEN data_compromised THEN 1 END) AS data_breach_count,
  COUNT(CASE WHEN bon_notified_at IS NOT NULL THEN 1 END) AS bon_notified_count
FROM security_incidents
WHERE detected_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(detected_at), severity
ORDER BY incident_date DESC, severity;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_security_incidents_updated_at
  BEFORE UPDATE ON security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Auto-calculate response times
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_incident_response_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate time to containment
  IF NEW.contained_at IS NOT NULL AND OLD.contained_at IS NULL THEN
    NEW.time_to_containment_minutes := EXTRACT(EPOCH FROM (NEW.contained_at - NEW.detected_at)) / 60;
  END IF;
  
  -- Calculate time to resolution
  IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
    NEW.time_to_resolution_minutes := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.detected_at)) / 60;
  END IF;
  
  -- Auto-require BoN notification for critical/high severity
  IF NEW.severity IN ('critical', 'high') THEN
    NEW.bon_notification_required := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_incident_response_times
  BEFORE UPDATE ON security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION calculate_incident_response_times();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE security_incidents IS 'PSD-12 §2.3: System-wide security incident tracking with severity classification and response timeline';
COMMENT ON TABLE incident_response_actions IS 'Audit trail of actions taken during incident response';
COMMENT ON VIEW vw_critical_incidents IS 'Open critical/high severity incidents requiring immediate attention';
COMMENT ON VIEW vw_incident_response_metrics IS 'Incident response time metrics for KRI calculation';

-- Migration complete

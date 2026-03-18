-- Migration: 033_sla_compliance_log.sql
-- Purpose: PSD-7 §3.2 - SLA breach tracking and compliance monitoring
-- Priority: HIGH
-- Date: 2026-03-17

-- ============================================================================
-- SLA COMPLIANCE LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sla_compliance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- SLA definition
  sla_type VARCHAR(50) NOT NULL CHECK (sla_type IN (
    'system_uptime',              -- Target: 99.9% monthly uptime
    'api_response_time',          -- Target: <500ms p95
    'transaction_processing',     -- Target: <2s p99
    'dispute_resolution',         -- Target: <48h
    'kyc_verification',           -- Target: <24h
    'customer_support_response',  -- Target: <4h
    'obs_api_uptime',             -- Target: 99.5% monthly
    'obs_api_latency'             -- Target: <1s p95
  )),
  
  -- Measurement period
  measurement_start TIMESTAMPTZ NOT NULL,
  measurement_end TIMESTAMPTZ NOT NULL,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- SLA targets and actuals
  target_value NUMERIC(10,4) NOT NULL,
  actual_value NUMERIC(10,4) NOT NULL,
  unit VARCHAR(20) NOT NULL CHECK (unit IN ('percentage', 'milliseconds', 'hours', 'count')),
  
  -- Compliance status
  sla_met BOOLEAN NOT NULL,
  variance NUMERIC(10,4) GENERATED ALWAYS AS (actual_value - target_value) STORED,
  variance_pct NUMERIC(7,4),
  
  -- Breach details (if SLA not met)
  breach_severity VARCHAR(20) CHECK (breach_severity IN ('minor', 'moderate', 'major', 'critical')),
  breach_duration_minutes INTEGER,
  root_cause TEXT,
  impact_description TEXT,
  affected_users_count INTEGER,
  
  -- Response
  incident_id UUID REFERENCES security_incidents(id) ON DELETE SET NULL,
  remediation_action TEXT,
  resolved_at TIMESTAMPTZ,
  
  -- BoN reporting
  reported_to_bon BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sla_log_type_date ON sla_compliance_log(sla_type, measurement_date DESC);
CREATE INDEX idx_sla_log_breaches ON sla_compliance_log(sla_met, measurement_date DESC) WHERE sla_met = false;
CREATE INDEX idx_sla_log_severity ON sla_compliance_log(breach_severity, measurement_date DESC) 
  WHERE breach_severity IN ('major', 'critical');

-- ============================================================================
-- SLA SUMMARY VIEW
-- ============================================================================
CREATE OR REPLACE VIEW vw_sla_summary AS
SELECT
  sla_type,
  DATE_TRUNC('month', measurement_date) AS month,
  COUNT(*) AS total_measurements,
  COUNT(CASE WHEN sla_met THEN 1 END) AS sla_met_count,
  COUNT(CASE WHEN NOT sla_met THEN 1 END) AS sla_breach_count,
  (COUNT(CASE WHEN sla_met THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100) AS compliance_rate,
  AVG(actual_value) AS avg_actual_value,
  AVG(target_value) AS avg_target_value,
  MAX(measurement_date) AS last_measurement_date
FROM sla_compliance_log
WHERE measurement_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY sla_type, DATE_TRUNC('month', measurement_date)
ORDER BY month DESC, sla_type;

-- ============================================================================
-- INITIAL SLA TARGETS
-- ============================================================================
-- Seed with monthly SLA baseline for current month
INSERT INTO sla_compliance_log (
  sla_type,
  measurement_start,
  measurement_end,
  measurement_date,
  target_value,
  actual_value,
  unit,
  sla_met
) VALUES
(
  'system_uptime',
  DATE_TRUNC('month', CURRENT_DATE),
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second',
  CURRENT_DATE,
  99.9,
  99.95,
  'percentage',
  true
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE sla_compliance_log IS 'PSD-7 §3.2: SLA breach tracking and compliance monitoring for BoN reporting';
COMMENT ON VIEW vw_sla_summary IS 'Monthly SLA compliance summary with breach analysis';

-- Migration complete

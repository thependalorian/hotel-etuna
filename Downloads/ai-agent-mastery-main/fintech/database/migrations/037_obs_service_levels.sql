-- Migration: 037_obs_service_levels.sql
-- Purpose: OBS v1.0 §9.2 - Service level monitoring (uptime, latency, error rates)
-- Priority: MEDIUM
-- Date: 2026-03-17

-- ============================================================================
-- OBS SERVICE LEVELS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS obs_service_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time window
  measurement_hour TIMESTAMPTZ NOT NULL,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Service endpoint
  data_provider_code VARCHAR(20) NOT NULL,
  endpoint_type VARCHAR(30) NOT NULL CHECK (endpoint_type IN (
    'authorization',
    'token',
    'accounts',
    'balances',
    'transactions',
    'payments',
    'consent_revocation',
    'overall'
  )),
  
  -- Availability metrics
  total_minutes INTEGER NOT NULL DEFAULT 60,
  available_minutes INTEGER NOT NULL CHECK (available_minutes >= 0 AND available_minutes <= 60),
  unavailable_minutes INTEGER GENERATED ALWAYS AS (total_minutes - available_minutes) STORED,
  availability_pct NUMERIC(5,2) GENERATED ALWAYS AS ((available_minutes::NUMERIC / total_minutes::NUMERIC) * 100) STORED,
  
  -- Request metrics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  error_rate NUMERIC(5,2),
  
  -- Latency metrics
  avg_latency_ms INTEGER,
  p50_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  p99_latency_ms INTEGER,
  max_latency_ms INTEGER,
  
  -- SLA compliance (OBS requires 99.5% uptime, <1s p95 latency)
  sla_uptime_met BOOLEAN,
  sla_latency_met BOOLEAN,
  sla_error_rate_met BOOLEAN,
  overall_sla_met BOOLEAN,
  
  -- Downtime tracking
  downtime_incident_count INTEGER DEFAULT 0,
  longest_downtime_minutes INTEGER,
  downtime_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_obs_service_hour ON obs_service_levels(data_provider_code, endpoint_type, measurement_hour);
CREATE INDEX idx_obs_service_date ON obs_service_levels(measurement_date DESC, data_provider_code);
CREATE INDEX idx_obs_service_sla_breach ON obs_service_levels(overall_sla_met, measurement_date DESC) 
  WHERE overall_sla_met = false;

-- ============================================================================
-- DAILY SERVICE LEVEL SUMMARY
-- ============================================================================
CREATE OR REPLACE VIEW vw_obs_daily_service_summary AS
SELECT
  measurement_date,
  data_provider_code,
  endpoint_type,
  SUM(available_minutes) AS total_available_minutes,
  SUM(total_minutes) AS total_possible_minutes,
  (SUM(available_minutes)::NUMERIC / SUM(total_minutes)::NUMERIC * 100) AS daily_availability_pct,
  SUM(total_requests) AS total_daily_requests,
  SUM(successful_requests) AS successful_daily_requests,
  (SUM(failed_requests)::NUMERIC / NULLIF(SUM(total_requests), 0)::NUMERIC * 100) AS daily_error_rate,
  AVG(p95_latency_ms) AS avg_p95_latency_ms,
  COUNT(CASE WHEN overall_sla_met = false THEN 1 END) AS sla_breach_hours
FROM obs_service_levels
WHERE measurement_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY measurement_date, data_provider_code, endpoint_type
ORDER BY measurement_date DESC, data_provider_code, endpoint_type;

-- ============================================================================
-- MONTHLY SLA REPORT (FOR BON)
-- ============================================================================
CREATE OR REPLACE VIEW vw_obs_monthly_sla_report AS
SELECT
  DATE_TRUNC('month', measurement_date) AS report_month,
  data_provider_code,
  endpoint_type,
  (SUM(available_minutes)::NUMERIC / SUM(total_minutes)::NUMERIC * 100) AS monthly_availability_pct,
  SUM(total_requests) AS total_monthly_requests,
  (SUM(failed_requests)::NUMERIC / NULLIF(SUM(total_requests), 0)::NUMERIC * 100) AS monthly_error_rate,
  AVG(p95_latency_ms) AS avg_p95_latency_ms,
  COUNT(CASE WHEN overall_sla_met = false THEN 1 END) AS sla_breach_hours,
  CASE 
    WHEN (SUM(available_minutes)::NUMERIC / SUM(total_minutes)::NUMERIC * 100) >= 99.5 THEN 'compliant'
    ELSE 'non_compliant'
  END AS obs_sla_status
FROM obs_service_levels
WHERE measurement_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
GROUP BY DATE_TRUNC('month', measurement_date), data_provider_code, endpoint_type
ORDER BY report_month DESC, data_provider_code, endpoint_type;

COMMENT ON TABLE obs_service_levels IS 'OBS v1.0 §9.2: Service level monitoring for OBS API (99.5% uptime, <1s p95 latency)';
COMMENT ON VIEW vw_obs_daily_service_summary IS 'Daily OBS service level metrics for monitoring dashboards';
COMMENT ON VIEW vw_obs_monthly_sla_report IS 'Monthly OBS SLA compliance report for BoN (requires 99.5% uptime)';

-- Migration complete

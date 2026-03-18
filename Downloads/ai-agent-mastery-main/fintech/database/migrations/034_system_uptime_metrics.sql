-- Migration: 034_system_uptime_metrics.sql
-- Purpose: PSD-7 §3.3 - System uptime tracking (99.9% target)
-- Priority: HIGH
-- Date: 2026-03-17

-- ============================================================================
-- SYSTEM UPTIME METRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_uptime_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time window
  measurement_hour TIMESTAMPTZ NOT NULL,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Service component
  service_name VARCHAR(50) NOT NULL CHECK (service_name IN (
    'api_gateway',
    'auth_service',
    'transaction_service',
    'wallet_service',
    'obs_service',
    'database',
    'redis_cache',
    'message_queue',
    'web_app',
    'mobile_app',
    'overall_system'
  )),
  
  -- Uptime metrics
  total_minutes INTEGER NOT NULL DEFAULT 60,
  uptime_minutes INTEGER NOT NULL CHECK (uptime_minutes >= 0 AND uptime_minutes <= 60),
  downtime_minutes INTEGER GENERATED ALWAYS AS (total_minutes - uptime_minutes) STORED,
  uptime_percentage NUMERIC(5,2) GENERATED ALWAYS AS ((uptime_minutes::NUMERIC / total_minutes::NUMERIC) * 100) STORED,
  
  -- Health check results
  total_health_checks INTEGER DEFAULT 0,
  successful_health_checks INTEGER DEFAULT 0,
  failed_health_checks INTEGER DEFAULT 0,
  
  -- Downtime incidents
  downtime_count INTEGER DEFAULT 0,
  longest_downtime_minutes INTEGER,
  downtime_reason TEXT,
  
  -- Performance metrics
  avg_response_time_ms INTEGER,
  p95_response_time_ms INTEGER,
  p99_response_time_ms INTEGER,
  
  -- Error rates
  total_requests BIGINT DEFAULT 0,
  successful_requests BIGINT DEFAULT 0,
  failed_requests BIGINT DEFAULT 0,
  error_rate NUMERIC(5,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_uptime_service_hour ON system_uptime_metrics(service_name, measurement_hour);
CREATE INDEX idx_uptime_date ON system_uptime_metrics(measurement_date DESC, service_name);
CREATE INDEX idx_uptime_downtime ON system_uptime_metrics(downtime_minutes DESC, measurement_date DESC) 
  WHERE downtime_minutes > 0;

-- ============================================================================
-- DAILY UPTIME SUMMARY VIEW
-- ============================================================================
CREATE OR REPLACE VIEW vw_daily_uptime_summary AS
SELECT
  measurement_date,
  service_name,
  SUM(uptime_minutes) AS total_uptime_minutes,
  SUM(downtime_minutes) AS total_downtime_minutes,
  (SUM(uptime_minutes)::NUMERIC / SUM(total_minutes)::NUMERIC * 100) AS daily_uptime_pct,
  COUNT(CASE WHEN downtime_minutes > 0 THEN 1 END) AS downtime_incidents,
  MAX(longest_downtime_minutes) AS max_downtime_minutes
FROM system_uptime_metrics
WHERE measurement_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY measurement_date, service_name
ORDER BY measurement_date DESC, service_name;

-- ============================================================================
-- MONTHLY UPTIME VIEW (FOR BON REPORTING)
-- ============================================================================
CREATE OR REPLACE VIEW vw_monthly_uptime AS
SELECT
  DATE_TRUNC('month', measurement_date) AS month,
  service_name,
  SUM(uptime_minutes) AS total_uptime_minutes,
  SUM(total_minutes) AS total_possible_minutes,
  (SUM(uptime_minutes)::NUMERIC / SUM(total_minutes)::NUMERIC * 100) AS monthly_uptime_pct,
  COUNT(CASE WHEN downtime_minutes > 0 THEN 1 END) AS total_downtime_incidents,
  SUM(downtime_minutes) AS total_downtime_minutes,
  CASE 
    WHEN (SUM(uptime_minutes)::NUMERIC / SUM(total_minutes)::NUMERIC * 100) >= 99.9 THEN 'compliant'
    ELSE 'non_compliant'
  END AS sla_status
FROM system_uptime_metrics
WHERE measurement_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
GROUP BY DATE_TRUNC('month', measurement_date), service_name
ORDER BY month DESC, service_name;

COMMENT ON TABLE system_uptime_metrics IS 'PSD-7 §3.3: Hourly system uptime tracking for 99.9% SLA compliance';
COMMENT ON VIEW vw_daily_uptime_summary IS 'Daily uptime aggregation for monitoring dashboards';
COMMENT ON VIEW vw_monthly_uptime IS 'Monthly uptime metrics for BoN reporting (PSD-7 §3.3 requires 99.9% uptime)';

-- Migration complete

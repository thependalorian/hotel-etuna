-- Migration: 036_obs_api_call_logs.sql
-- Purpose: OBS v1.0 §9.1 - API call logging for monthly BoN reporting
-- Priority: HIGH
-- Date: 2026-03-17

-- ============================================================================
-- OBS API CALL LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS obs_api_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- API call identification
  request_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  
  -- Endpoint details
  endpoint_path VARCHAR(255) NOT NULL,
  http_method VARCHAR(10) NOT NULL CHECK (http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  api_category VARCHAR(30) NOT NULL CHECK (api_category IN (
    'accounts',        -- Account information retrieval
    'balances',        -- Balance inquiries
    'transactions',    -- Transaction history
    'payments',        -- Payment initiation
    'consent',         -- Consent management
    'authentication'   -- OIDC/OAuth flows
  )),
  
  -- Request details
  tpp_id UUID REFERENCES tpp_registrations(id) ON DELETE SET NULL,
  tpp_code VARCHAR(20),
  data_provider_code VARCHAR(20),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  consent_id UUID REFERENCES obs_consents(id) ON DELETE SET NULL,
  
  -- Response details
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_code VARCHAR(50),
  error_message TEXT,
  
  -- Request/Response size
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  
  -- Geographic and security
  source_ip INET,
  user_agent TEXT,
  
  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partitioning by month for performance (execute separately if using declarative partitioning)
CREATE INDEX idx_obs_api_logs_date ON obs_api_call_logs(requested_at DESC);
CREATE INDEX idx_obs_api_logs_tpp_date ON obs_api_call_logs(tpp_code, requested_at DESC);
CREATE INDEX idx_obs_api_logs_endpoint ON obs_api_call_logs(api_category, requested_at DESC);
CREATE INDEX idx_obs_api_logs_status ON obs_api_call_logs(status_code, requested_at DESC);
CREATE INDEX idx_obs_api_logs_errors ON obs_api_call_logs(error_code, requested_at DESC) 
  WHERE success = false;

-- ============================================================================
-- DAILY API USAGE SUMMARY VIEW
-- ============================================================================
CREATE OR REPLACE VIEW vw_obs_daily_api_usage AS
SELECT
  DATE(requested_at) AS api_date,
  tpp_code,
  api_category,
  COUNT(*) AS total_calls,
  COUNT(CASE WHEN success THEN 1 END) AS successful_calls,
  COUNT(CASE WHEN NOT success THEN 1 END) AS failed_calls,
  (COUNT(CASE WHEN NOT success THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100) AS error_rate,
  AVG(response_time_ms) AS avg_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) AS p95_response_time_ms,
  MAX(response_time_ms) AS max_response_time_ms,
  SUM(request_size_bytes) AS total_request_bytes,
  SUM(response_size_bytes) AS total_response_bytes
FROM obs_api_call_logs
WHERE requested_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(requested_at), tpp_code, api_category
ORDER BY api_date DESC, tpp_code, api_category;

-- ============================================================================
-- MONTHLY BON REPORTING VIEW
-- ============================================================================
CREATE OR REPLACE VIEW vw_obs_monthly_bon_report AS
SELECT
  DATE_TRUNC('month', requested_at) AS report_month,
  tpp_code,
  api_category,
  COUNT(*) AS total_api_calls,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT consent_id) AS unique_consents,
  COUNT(CASE WHEN success THEN 1 END) AS successful_calls,
  COUNT(CASE WHEN NOT success THEN 1 END) AS failed_calls,
  (COUNT(CASE WHEN success THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100) AS success_rate,
  AVG(response_time_ms) AS avg_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) AS p95_response_time_ms
FROM obs_api_call_logs
WHERE requested_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
GROUP BY DATE_TRUNC('month', requested_at), tpp_code, api_category
ORDER BY report_month DESC, tpp_code, api_category;

COMMENT ON TABLE obs_api_call_logs IS 'OBS v1.0 §9.1: Comprehensive API call logging for monthly BoN reporting and performance monitoring';
COMMENT ON VIEW vw_obs_daily_api_usage IS 'Daily OBS API usage statistics for monitoring and alerting';
COMMENT ON VIEW vw_obs_monthly_bon_report IS 'Monthly aggregated API usage report for BoN regulatory submission';

-- Migration complete

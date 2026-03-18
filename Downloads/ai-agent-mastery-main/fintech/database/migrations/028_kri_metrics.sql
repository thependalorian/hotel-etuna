-- Migration: 028_kri_metrics.sql
-- Purpose: PSD-12 §2.1 - Key Risk Indicators (KRI) tracking and monitoring
-- Priority: CRITICAL
-- Date: 2026-03-17

-- ============================================================================
-- KRI METRICS TABLE
-- ============================================================================
-- Tracks Key Risk Indicators for monthly BoN reporting (PSD-12 §2.1)
CREATE TABLE IF NOT EXISTS kri_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- KRI identification
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
    -- Operational Risk
    'system_uptime_pct',              -- Target: ≥99.9%
    'transaction_success_rate',       -- Target: ≥99.5%
    'avg_transaction_time_ms',        -- Target: ≤2000ms
    'api_error_rate',                 -- Target: ≤0.5%
    
    -- Fraud Risk
    'fraud_detection_rate',           -- Fraud cases detected / total fraud
    'false_positive_rate',            -- False alarms / total alerts
    'fraud_loss_amount',              -- NAD lost to fraud
    'fraud_loss_ratio',               -- Fraud loss / transaction volume
    
    -- Credit Risk
    'loan_default_rate',              -- Defaulted loans / total active loans
    'average_credit_score',           -- Mean credit score of users
    'high_risk_loan_ratio',           -- Loans with credit score <300
    
    -- Liquidity Risk
    'trust_account_ratio',            -- Trust balance / e-money float (target: ≥100%)
    'average_wallet_balance',         -- Mean wallet balance
    'max_single_exposure',            -- Largest wallet balance
    
    -- Compliance Risk
    'kyc_completion_rate',            -- KYC verified / total users
    'unverified_transaction_ratio',   -- Transactions by basic tier users
    'compliance_violation_count',     -- Active compliance violations
    'penalty_amount',                 -- Total penalties in period
    
    -- Cybersecurity Risk
    'security_incident_count',        -- Security incidents in period
    'critical_incident_count',        -- Severity = critical
    'phishing_attempt_rate',          -- Phishing attempts detected
    'suspicious_login_count',         -- Anomalous login attempts
    
    -- Customer Service Risk
    'dispute_resolution_time_hours',  -- Avg time to resolve dispute
    'customer_complaint_count',       -- Total complaints in period
    'unresolved_dispute_count',       -- Open disputes >30 days
    
    -- Third-Party Risk
    'tpp_connection_success_rate',    -- OBS API uptime
    'tpp_data_breach_count',          -- TPP security incidents
    'vendor_sla_breach_count'         -- Vendor SLA failures
  )),
  
  -- Metric value and target
  metric_value NUMERIC(15,4) NOT NULL,
  target_value NUMERIC(15,4) NOT NULL,
  unit VARCHAR(20) NOT NULL CHECK (unit IN ('percentage', 'count', 'amount', 'milliseconds', 'hours', 'ratio')),
  
  -- Risk assessment
  status VARCHAR(20) NOT NULL DEFAULT 'green' CHECK (status IN (
    'green',     -- Within acceptable limits
    'amber',     -- Approaching threshold (80-100% of target)
    'red'        -- Exceeds threshold (>100% of target)
  )),
  risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Time period
  measurement_period VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (measurement_period IN ('hourly', 'daily', 'weekly', 'monthly')),
  measurement_start TIMESTAMPTZ NOT NULL,
  measurement_end TIMESTAMPTZ NOT NULL,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Alerting
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMPTZ,
  alert_recipients TEXT[],
  
  -- BoN reporting
  reported_to_bon BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMPTZ,
  bon_report_reference VARCHAR(50),
  
  -- Context and analysis
  notes TEXT,
  contributing_factors JSONB DEFAULT '{}',
  remediation_actions TEXT,
  
  -- Audit trail
  calculated_by VARCHAR(50) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_kri_date_type ON kri_metrics(measurement_date DESC, metric_type);
CREATE INDEX idx_kri_type_period ON kri_metrics(metric_type, measurement_period, measurement_date DESC);
CREATE INDEX idx_kri_status ON kri_metrics(status, measurement_date DESC) WHERE status IN ('amber', 'red');
CREATE INDEX idx_kri_risk_level ON kri_metrics(risk_level, measurement_date DESC) WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_kri_alert_pending ON kri_metrics(alert_sent, status) WHERE alert_sent = false AND status IN ('amber', 'red');
CREATE INDEX idx_kri_bon_reporting ON kri_metrics(reported_to_bon, measurement_date DESC) WHERE reported_to_bon = false;

-- Unique constraint: one entry per metric type per period per date
CREATE UNIQUE INDEX idx_kri_unique_metric_period ON kri_metrics(metric_type, measurement_period, measurement_date);

-- ============================================================================
-- KRI THRESHOLDS TABLE
-- ============================================================================
-- Configurable thresholds for each KRI metric
CREATE TABLE IF NOT EXISTS kri_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL UNIQUE,
  
  -- Target and thresholds
  target_value NUMERIC(15,4) NOT NULL,
  amber_threshold NUMERIC(15,4) NOT NULL,
  red_threshold NUMERIC(15,4) NOT NULL,
  
  -- Threshold direction
  threshold_direction VARCHAR(10) NOT NULL CHECK (threshold_direction IN ('above', 'below')),
  
  -- Active status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Alerting configuration
  alert_on_amber BOOLEAN NOT NULL DEFAULT true,
  alert_on_red BOOLEAN NOT NULL DEFAULT true,
  alert_email_recipients TEXT[] DEFAULT ARRAY['compliance@smartpay.na'],
  
  -- BoN reporting
  include_in_bon_report BOOLEAN NOT NULL DEFAULT true,
  bon_report_category VARCHAR(50),
  
  -- Metadata
  description TEXT,
  calculation_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kri_thresholds_active ON kri_thresholds(is_active) WHERE is_active = true;

-- ============================================================================
-- KRI TREND VIEW
-- ============================================================================
-- 30-day trend analysis for each KRI
CREATE OR REPLACE VIEW vw_kri_trends AS
WITH recent_metrics AS (
  SELECT
    metric_type,
    measurement_date,
    metric_value,
    target_value,
    status,
    ROW_NUMBER() OVER (PARTITION BY metric_type ORDER BY measurement_date DESC) AS rn
  FROM kri_metrics
  WHERE measurement_period = 'daily'
    AND measurement_date >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT
  metric_type,
  MAX(measurement_date) AS latest_measurement_date,
  MAX(CASE WHEN rn = 1 THEN metric_value END) AS current_value,
  MAX(CASE WHEN rn = 1 THEN target_value END) AS target_value,
  AVG(metric_value) AS avg_30d_value,
  MIN(metric_value) AS min_30d_value,
  MAX(metric_value) AS max_30d_value,
  STDDEV(metric_value) AS stddev_30d,
  COUNT(CASE WHEN status = 'green' THEN 1 END) AS days_green,
  COUNT(CASE WHEN status = 'amber' THEN 1 END) AS days_amber,
  COUNT(CASE WHEN status = 'red' THEN 1 END) AS days_red,
  MAX(CASE WHEN rn = 1 THEN status END) AS current_status
FROM recent_metrics
GROUP BY metric_type
ORDER BY metric_type;

-- ============================================================================
-- CRITICAL KRI ALERTS VIEW
-- ============================================================================
-- Active KRI alerts requiring immediate attention
CREATE OR REPLACE VIEW vw_critical_kri_alerts AS
SELECT
  k.id,
  k.metric_type,
  k.metric_value,
  k.target_value,
  k.status,
  k.risk_level,
  k.measurement_date,
  k.alert_sent,
  k.notes,
  t.description,
  t.alert_email_recipients
FROM kri_metrics k
LEFT JOIN kri_thresholds t ON k.metric_type = t.metric_type
WHERE k.status IN ('amber', 'red')
  AND k.alert_sent = false
  AND k.measurement_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY 
  CASE k.risk_level 
    WHEN 'critical' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    ELSE 4 
  END,
  k.measurement_date DESC;

-- ============================================================================
-- FUNCTION: Calculate KRI Status
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_kri_status(
  p_metric_type VARCHAR,
  p_metric_value NUMERIC,
  p_target_value NUMERIC
) RETURNS TABLE(
  status VARCHAR(20),
  risk_level VARCHAR(20)
) AS $$
DECLARE
  v_threshold RECORD;
  v_status VARCHAR(20) DEFAULT 'green';
  v_risk_level VARCHAR(20) DEFAULT 'low';
  v_deviation NUMERIC;
BEGIN
  -- Get threshold configuration
  SELECT * INTO v_threshold
  FROM kri_thresholds
  WHERE metric_type = p_metric_type
    AND is_active = true;
  
  IF NOT FOUND THEN
    -- No threshold configured, use default 80/100% logic
    v_deviation := ABS((p_metric_value - p_target_value) / NULLIF(p_target_value, 0)) * 100;
    
    IF v_deviation <= 10 THEN
      v_status := 'green';
      v_risk_level := 'low';
    ELSIF v_deviation <= 20 THEN
      v_status := 'amber';
      v_risk_level := 'medium';
    ELSE
      v_status := 'red';
      v_risk_level := 'high';
    END IF;
  ELSE
    -- Use configured thresholds
    IF v_threshold.threshold_direction = 'above' THEN
      -- Higher is worse (e.g., fraud rate, incident count)
      IF p_metric_value <= v_threshold.amber_threshold THEN
        v_status := 'green';
        v_risk_level := 'low';
      ELSIF p_metric_value <= v_threshold.red_threshold THEN
        v_status := 'amber';
        v_risk_level := 'medium';
      ELSE
        v_status := 'red';
        v_risk_level := 'high';
      END IF;
    ELSE
      -- Lower is worse (e.g., uptime, success rate)
      IF p_metric_value >= v_threshold.amber_threshold THEN
        v_status := 'green';
        v_risk_level := 'low';
      ELSIF p_metric_value >= v_threshold.red_threshold THEN
        v_status := 'amber';
        v_risk_level := 'medium';
      ELSE
        v_status := 'red';
        v_risk_level := 'high';
      END IF;
    END IF;
  END IF;
  
  RETURN QUERY SELECT v_status, v_risk_level;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_kri_metrics_updated_at
  BEFORE UPDATE ON kri_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kri_thresholds_updated_at
  BEFORE UPDATE ON kri_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL KRI THRESHOLDS
-- ============================================================================

INSERT INTO kri_thresholds (metric_type, target_value, amber_threshold, red_threshold, threshold_direction, description, calculation_method) VALUES
-- Operational Risk
('system_uptime_pct', 99.9, 99.5, 99.0, 'below', 'System uptime percentage (PSD-7 §3.3)', 'Total uptime minutes / total minutes * 100'),
('transaction_success_rate', 99.5, 99.0, 98.0, 'below', 'Successful transactions / total transactions * 100', 'Completed transactions / (completed + failed) * 100'),
('avg_transaction_time_ms', 2000, 2500, 3000, 'above', 'Average transaction processing time (PSD-7 §3.1)', 'SUM(processing_time_ms) / COUNT(*)'),
('api_error_rate', 0.5, 1.0, 2.0, 'above', 'API errors / total API calls * 100', 'Failed API calls / total API calls * 100'),

-- Fraud Risk
('fraud_detection_rate', 95.0, 90.0, 85.0, 'below', 'Fraud cases detected / total fraud cases * 100', 'Detected fraud / (detected + undetected) * 100'),
('fraud_loss_ratio', 0.01, 0.05, 0.1, 'above', 'Fraud loss as % of transaction volume', 'Fraud loss amount / total transaction volume * 100'),

-- Liquidity Risk
('trust_account_ratio', 100.0, 98.0, 95.0, 'below', 'Trust account coverage of e-money float (PSD-3 §2.5)', 'Trust account balance / e-money float * 100'),

-- Compliance Risk
('kyc_completion_rate', 90.0, 80.0, 70.0, 'below', 'KYC verified users / total users * 100', 'Verified users / total users * 100'),
('compliance_violation_count', 0, 3, 5, 'above', 'Active unresolved compliance violations', 'COUNT(*) WHERE resolved_at IS NULL')

ON CONFLICT (metric_type) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE kri_metrics IS 'PSD-12 §2.1: Key Risk Indicators for monthly BoN reporting and proactive risk management';
COMMENT ON TABLE kri_thresholds IS 'Configurable thresholds for KRI alerting and risk classification';
COMMENT ON VIEW vw_kri_trends IS '30-day trend analysis for KRI metrics';
COMMENT ON VIEW vw_critical_kri_alerts IS 'Unresolved amber/red KRI alerts requiring action';

-- Migration complete

-- Migration: 030_transaction_monitoring_alerts.sql
-- Purpose: PSD-12 §2.5 - Real-time transaction monitoring and fraud detection alerts
-- Priority: CRITICAL
-- Date: 2026-03-17

-- ============================================================================
-- TRANSACTION MONITORING ALERTS TABLE
-- ============================================================================
-- Real-time fraud detection and suspicious activity alerts (PSD-12 §2.5)
CREATE TABLE IF NOT EXISTS transaction_monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Alert identification
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'high_value_transaction',        -- Single transaction exceeds threshold
    'velocity_breach',               -- Too many transactions in short period
    'unusual_pattern',               -- Deviation from user's normal behavior
    'dormant_account_activity',      -- Activity on long-inactive account
    'multiple_failed_attempts',      -- Multiple failed transactions
    'suspicious_merchant',           -- Transaction with flagged merchant
    'cross_border_red_flag',         -- Suspicious cross-border transfer
    'structuring_detected',          -- Potential money laundering (structuring)
    'round_amount_pattern',          -- Unusual round amount pattern
    'rapid_cash_out',                -- Rapid cash-out after deposit
    'geographic_anomaly',            -- Transaction from unusual location
    'device_anomaly',                -- Transaction from new/suspicious device
    'time_anomaly',                  -- Transaction at unusual time
    'kyc_tier_violation',            -- Transaction exceeds KYC tier limit
    'blacklist_match',               -- User/merchant on blacklist
    'duplicate_transaction',         -- Potential duplicate
    'refund_abuse',                  -- Unusual refund pattern
    'account_takeover_suspected',    -- Signs of account compromise
    'other'
  )),
  
  -- Severity and priority
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  
  -- Alert status
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',              -- Alert generated, pending review
    'investigating',     -- Under investigation
    'confirmed_fraud',   -- Confirmed as fraud
    'false_positive',    -- Not fraud, business as usual
    'escalated',         -- Escalated to compliance team
    'resolved',          -- Investigation complete
    'closed'             -- Alert closed
  )),
  
  -- Related entities
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  related_alert_ids UUID[],  -- Linked alerts for pattern detection
  
  -- Alert details
  alert_reason TEXT NOT NULL,
  risk_score NUMERIC(5,2) CHECK (risk_score BETWEEN 0 AND 100),
  confidence_level NUMERIC(5,2) CHECK (confidence_level BETWEEN 0 AND 100),
  
  -- Detection
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detection_rule_id UUID REFERENCES fraud_detection_rules(id) ON DELETE SET NULL,
  detection_method VARCHAR(30) CHECK (detection_method IN ('rule_based', 'ml_model', 'manual_review', 'external_feed')),
  
  -- Transaction context
  transaction_amount NUMERIC(15,2),
  transaction_currency CHAR(3) DEFAULT 'NAD',
  transaction_type VARCHAR(50),
  merchant_name VARCHAR(100),
  
  -- User context
  user_kyc_tier VARCHAR(20),
  user_account_age_days INTEGER,
  user_transaction_count INTEGER,
  user_risk_profile VARCHAR(20) CHECK (user_risk_profile IN ('low', 'medium', 'high')),
  
  -- Response
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Actions taken
  transaction_blocked BOOLEAN NOT NULL DEFAULT false,
  account_frozen BOOLEAN NOT NULL DEFAULT false,
  user_notified BOOLEAN NOT NULL DEFAULT false,
  user_notified_at TIMESTAMPTZ,
  
  -- Case management
  case_opened BOOLEAN NOT NULL DEFAULT false,
  case_id UUID,
  case_assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution_category VARCHAR(30) CHECK (resolution_category IN (
    'confirmed_fraud',
    'false_positive',
    'user_error',
    'system_error',
    'legitimate_activity',
    'unknown'
  )),
  
  -- Feedback loop (for ML model improvement)
  feedback_provided BOOLEAN NOT NULL DEFAULT false,
  feedback_correct_classification BOOLEAN,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_alerts_user_status ON transaction_monitoring_alerts(user_id, status, detected_at DESC);
CREATE INDEX idx_alerts_transaction ON transaction_monitoring_alerts(transaction_id);
CREATE INDEX idx_alerts_status_severity ON transaction_monitoring_alerts(status, severity, detected_at DESC);
CREATE INDEX idx_alerts_open ON transaction_monitoring_alerts(status, priority DESC, detected_at ASC) 
  WHERE status IN ('open', 'investigating');
CREATE INDEX idx_alerts_risk_score ON transaction_monitoring_alerts(risk_score DESC, detected_at DESC) 
  WHERE status = 'open';
CREATE INDEX idx_alerts_type_date ON transaction_monitoring_alerts(alert_type, detected_at DESC);
CREATE INDEX idx_alerts_detection_rule ON transaction_monitoring_alerts(detection_rule_id, detected_at DESC) 
  WHERE detection_rule_id IS NOT NULL;

-- ============================================================================
-- ALERT QUEUE VIEW
-- ============================================================================
-- Prioritized queue of alerts requiring review
CREATE OR REPLACE VIEW vw_alert_queue AS
SELECT
  a.id,
  a.alert_type,
  a.severity,
  a.priority,
  a.user_id,
  u.phone AS user_phone,
  u.kyc_tier,
  a.transaction_id,
  a.transaction_amount,
  a.risk_score,
  a.alert_reason,
  a.detected_at,
  EXTRACT(EPOCH FROM (NOW() - a.detected_at)) / 3600 AS hours_since_detected
FROM transaction_monitoring_alerts a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.status IN ('open', 'investigating')
ORDER BY
  CASE a.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  a.priority DESC,
  a.detected_at ASC;

-- ============================================================================
-- FRAUD DETECTION METRICS VIEW
-- ============================================================================
-- Daily fraud detection metrics for KRI
CREATE OR REPLACE VIEW vw_fraud_detection_metrics AS
SELECT
  DATE(detected_at) AS alert_date,
  COUNT(*) AS total_alerts,
  COUNT(CASE WHEN severity = 'critical' THEN 1 END) AS critical_alerts,
  COUNT(CASE WHEN severity = 'high' THEN 1 END) AS high_alerts,
  COUNT(CASE WHEN resolution_category = 'confirmed_fraud' THEN 1 END) AS confirmed_fraud_count,
  COUNT(CASE WHEN resolution_category = 'false_positive' THEN 1 END) AS false_positive_count,
  AVG(risk_score) AS avg_risk_score,
  SUM(CASE WHEN transaction_blocked THEN 1 ELSE 0 END) AS transactions_blocked,
  SUM(CASE WHEN account_frozen THEN 1 ELSE 0 END) AS accounts_frozen,
  AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at)) / 3600) AS avg_resolution_time_hours
FROM transaction_monitoring_alerts
WHERE detected_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(detected_at)
ORDER BY alert_date DESC;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON transaction_monitoring_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Auto-calculate alert priority
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_alert_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate priority based on severity, risk score, and context
  NEW.priority := CASE NEW.severity
    WHEN 'critical' THEN 10
    WHEN 'high' THEN 8
    WHEN 'medium' THEN 5
    WHEN 'low' THEN 3
  END;
  
  -- Boost priority for high risk scores
  IF NEW.risk_score >= 80 THEN
    NEW.priority := LEAST(NEW.priority + 2, 10);
  END IF;
  
  -- Boost priority for high-value transactions
  IF NEW.transaction_amount >= 50000 THEN
    NEW.priority := LEAST(NEW.priority + 1, 10);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_alert_priority
  BEFORE INSERT ON transaction_monitoring_alerts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_alert_priority();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE transaction_monitoring_alerts IS 'PSD-12 §2.5: Real-time transaction monitoring alerts for fraud detection and prevention';
COMMENT ON VIEW vw_alert_queue IS 'Prioritized queue of alerts requiring review, sorted by severity and age';
COMMENT ON VIEW vw_fraud_detection_metrics IS 'Daily fraud detection metrics for KRI calculation';

COMMENT ON COLUMN transaction_monitoring_alerts.risk_score IS 'Fraud risk score 0-100 (higher = more suspicious)';
COMMENT ON COLUMN transaction_monitoring_alerts.confidence_level IS 'Model confidence 0-100 (higher = more certain)';

-- Migration complete

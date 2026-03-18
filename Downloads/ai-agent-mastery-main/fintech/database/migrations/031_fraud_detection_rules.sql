-- Migration: 031_fraud_detection_rules.sql
-- Purpose: PSD-12 §2.5 - Configurable fraud detection rules engine
-- Priority: CRITICAL
-- Date: 2026-03-17

-- ============================================================================
-- FRAUD DETECTION RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS fraud_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rule identification
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
    'amount_threshold',
    'velocity_limit',
    'pattern_matching',
    'geographic_restriction',
    'time_restriction',
    'blacklist_check',
    'kyc_limit_enforcement',
    'behavioral_anomaly',
    'ml_model',
    'custom'
  )),
  
  -- Rule configuration
  rule_conditions JSONB NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Thresholds
  threshold_value NUMERIC(15,4),
  threshold_unit VARCHAR(30),
  
  -- Actions
  auto_block_transaction BOOLEAN NOT NULL DEFAULT false,
  auto_freeze_account BOOLEAN NOT NULL DEFAULT false,
  require_manual_review BOOLEAN NOT NULL DEFAULT true,
  notify_user BOOLEAN NOT NULL DEFAULT false,
  notify_compliance_team BOOLEAN NOT NULL DEFAULT true,
  
  -- Rule status
  is_active BOOLEAN NOT NULL DEFAULT true,
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  
  -- Performance metrics
  total_triggers INTEGER DEFAULT 0,
  confirmed_fraud_count INTEGER DEFAULT 0,
  false_positive_count INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5,2),
  
  -- Configuration
  applies_to_kyc_tiers TEXT[] DEFAULT ARRAY['basic', 'standard', 'premium'],
  applies_to_transaction_types TEXT[],
  exclude_user_ids UUID[],
  
  -- Metadata
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_modified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fraud_rules_active ON fraud_detection_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_fraud_rules_type ON fraud_detection_rules(rule_type, is_active);

-- ============================================================================
-- FRAUD RULE TRIGGERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS fraud_rule_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES fraud_detection_rules(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES transaction_monitoring_alerts(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Trigger details
  trigger_value NUMERIC(15,4),
  threshold_exceeded BOOLEAN NOT NULL,
  
  -- Outcome
  transaction_blocked BOOLEAN NOT NULL DEFAULT false,
  account_frozen BOOLEAN NOT NULL DEFAULT false,
  alert_created BOOLEAN NOT NULL DEFAULT true,
  
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rule_triggers_rule ON fraud_rule_triggers(rule_id, triggered_at DESC);
CREATE INDEX idx_rule_triggers_alert ON fraud_rule_triggers(alert_id);
CREATE INDEX idx_rule_triggers_transaction ON fraud_rule_triggers(transaction_id);

-- ============================================================================
-- INITIAL FRAUD DETECTION RULES
-- ============================================================================

INSERT INTO fraud_detection_rules (
  rule_name,
  rule_type,
  rule_conditions,
  alert_type,
  severity,
  threshold_value,
  threshold_unit,
  auto_block_transaction,
  require_manual_review,
  description
) VALUES
-- High-value transaction rules
(
  'High Value Single Transaction - Basic Tier',
  'amount_threshold',
  '{"max_amount": 500, "currency": "NAD", "kyc_tier": "basic"}'::jsonb,
  'kyc_tier_violation',
  'high',
  500,
  'NAD',
  true,
  true,
  'Block transactions >NAD 500 for basic tier users (PSD-3 §2.1)'
),
(
  'High Value Single Transaction - Standard Tier',
  'amount_threshold',
  '{"max_amount": 5000, "currency": "NAD", "kyc_tier": "standard"}'::jsonb,
  'kyc_tier_violation',
  'high',
  5000,
  'NAD',
  true,
  true,
  'Block transactions >NAD 5,000 for standard tier users (PSD-3 §2.1)'
),
(
  'Extremely High Value Transaction',
  'amount_threshold',
  '{"max_amount": 50000, "currency": "NAD"}'::jsonb,
  'high_value_transaction',
  'critical',
  50000,
  'NAD',
  false,
  true,
  'Flag transactions ≥NAD 50,000 for compliance review'
),

-- Velocity rules
(
  'Rapid Transaction Velocity',
  'velocity_limit',
  '{"max_transactions": 10, "time_window_minutes": 60}'::jsonb,
  'velocity_breach',
  'high',
  10,
  'transactions_per_hour',
  false,
  true,
  'Alert on >10 transactions within 1 hour'
),
(
  'Daily Transaction Limit - Basic Tier',
  'velocity_limit',
  '{"max_daily_amount": 1000, "currency": "NAD", "kyc_tier": "basic"}'::jsonb,
  'kyc_tier_violation',
  'high',
  1000,
  'NAD_per_day',
  true,
  true,
  'Block daily spend >NAD 1,000 for basic tier (PSD-3 §2.2)'
),

-- Pattern detection
(
  'Structuring Detection',
  'pattern_matching',
  '{"pattern": "multiple_just_below_threshold", "threshold": 9500, "count": 3, "window_hours": 24}'::jsonb,
  'structuring_detected',
  'critical',
  9500,
  'NAD',
  false,
  true,
  'Detect potential money laundering (structuring to avoid reporting)'
),
(
  'Dormant Account Reactivation',
  'behavioral_anomaly',
  '{"dormant_days": 90, "first_transaction_threshold": 1000}'::jsonb,
  'dormant_account_activity',
  'medium',
  90,
  'days',
  false,
  true,
  'Flag activity on accounts dormant >90 days with high first transaction'
),
(
  'Rapid Cash-Out After Deposit',
  'pattern_matching',
  '{"deposit_then_cashout_minutes": 30, "min_amount": 5000}'::jsonb,
  'rapid_cash_out',
  'high',
  30,
  'minutes',
  false,
  true,
  'Flag rapid cash-out within 30 minutes of deposit ≥NAD 5,000'
),

-- Time-based rules
(
  'Off-Hours High Value Transaction',
  'time_restriction',
  '{"restricted_hours": ["22:00-06:00"], "min_amount": 10000}'::jsonb,
  'time_anomaly',
  'medium',
  10000,
  'NAD',
  false,
  true,
  'Flag high-value transactions during night hours (22:00-06:00)'
),

-- Failed attempt monitoring
(
  'Multiple Failed Transactions',
  'pattern_matching',
  '{"max_failed_attempts": 3, "window_minutes": 15}'::jsonb,
  'multiple_failed_attempts',
  'high',
  3,
  'failed_attempts',
  false,
  true,
  'Flag >3 failed transactions within 15 minutes (potential card testing)'
)

ON CONFLICT (rule_name) DO NOTHING;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_fraud_rules_updated_at
  BEFORE UPDATE ON fraud_detection_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Update rule performance metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION update_fraud_rule_performance()
RETURNS TRIGGER AS $$
DECLARE
  v_rule_id UUID;
BEGIN
  -- Get rule ID from alert
  SELECT detection_rule_id INTO v_rule_id
  FROM transaction_monitoring_alerts
  WHERE id = NEW.alert_id;
  
  IF v_rule_id IS NOT NULL THEN
    -- Update rule trigger count
    UPDATE fraud_detection_rules
    SET 
      total_triggers = total_triggers + 1,
      confirmed_fraud_count = CASE 
        WHEN NEW.alert_id IN (
          SELECT id FROM transaction_monitoring_alerts 
          WHERE resolution_category = 'confirmed_fraud'
        ) THEN confirmed_fraud_count + 1
        ELSE confirmed_fraud_count
      END,
      false_positive_count = CASE 
        WHEN NEW.alert_id IN (
          SELECT id FROM transaction_monitoring_alerts 
          WHERE resolution_category = 'false_positive'
        ) THEN false_positive_count + 1
        ELSE false_positive_count
      END,
      accuracy_rate = CASE 
        WHEN total_triggers + 1 > 0 
        THEN (confirmed_fraud_count::NUMERIC / (total_triggers + 1)::NUMERIC) * 100
        ELSE NULL
      END
    WHERE id = v_rule_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fraud_rule_performance
  AFTER INSERT ON fraud_rule_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_fraud_rule_performance();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE fraud_detection_rules IS 'PSD-12 §2.5: Configurable fraud detection rules with performance tracking';
COMMENT ON TABLE fraud_rule_triggers IS 'Audit trail of fraud rule activations';

COMMENT ON COLUMN fraud_detection_rules.rule_conditions IS 'JSONB configuration for rule logic (thresholds, patterns, etc.)';
COMMENT ON COLUMN fraud_detection_rules.accuracy_rate IS 'Rule accuracy: confirmed fraud / total triggers * 100';

-- Migration complete

-- Migration: 042_ml_prediction_tables.sql
-- Purpose: ML model predictions storage for fraud detection, credit scoring, and analytics
-- Priority: CRITICAL
-- Date: 2026-03-18

-- ============================================================================
-- ML FRAUD PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ml_fraud_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Related entities
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  
  -- Prediction results
  fraud_probability NUMERIC(5,4) NOT NULL CHECK (fraud_probability BETWEEN 0 AND 1),
  is_fraud BOOLEAN NOT NULL,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  confidence_score NUMERIC(5,4) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  
  -- Model breakdown
  model_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  random_forest_score NUMERIC(5,4),
  xgboost_score NUMERIC(5,4),
  logistic_regression_score NUMERIC(5,4),
  ensemble_method VARCHAR(30) DEFAULT 'weighted_average',
  
  -- Features used (for explainability and audit)
  features_used JSONB NOT NULL,
  top_fraud_indicators JSONB,
  
  -- NPS fraud pattern features
  card_not_present BOOLEAN DEFAULT false,
  phone_scam_indicator BOOLEAN DEFAULT false,
  phishing_indicator BOOLEAN DEFAULT false,
  sim_swap_indicator BOOLEAN DEFAULT false,
  velocity_anomaly BOOLEAN DEFAULT false,
  geographic_anomaly BOOLEAN DEFAULT false,
  device_anomaly BOOLEAN DEFAULT false,
  time_anomaly BOOLEAN DEFAULT false,
  
  -- Actions taken
  transaction_blocked BOOLEAN NOT NULL DEFAULT false,
  alert_created BOOLEAN NOT NULL DEFAULT false,
  alert_id UUID REFERENCES transaction_monitoring_alerts(id) ON DELETE SET NULL,
  manual_review_required BOOLEAN NOT NULL DEFAULT false,
  
  -- Feedback loop (model improvement)
  actual_fraud BOOLEAN,
  feedback_provided_at TIMESTAMPTZ,
  feedback_provided_by UUID REFERENCES users(id) ON DELETE SET NULL,
  model_correct BOOLEAN,
  
  -- Inference metadata
  inference_time_ms INTEGER,
  features_version VARCHAR(20) DEFAULT 'v1.0',
  
  -- Timestamps
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ml_fraud_transaction ON ml_fraud_predictions(transaction_id);
CREATE INDEX idx_ml_fraud_user ON ml_fraud_predictions(user_id, predicted_at DESC);
CREATE INDEX idx_ml_fraud_high_risk ON ml_fraud_predictions(is_fraud, fraud_probability DESC) 
  WHERE fraud_probability >= 0.7;
CREATE INDEX idx_ml_fraud_pending_feedback ON ml_fraud_predictions(predicted_at DESC) 
  WHERE actual_fraud IS NULL;
CREATE INDEX idx_ml_fraud_nps_patterns ON ml_fraud_predictions(card_not_present, phone_scam_indicator, phishing_indicator, sim_swap_indicator);

-- ============================================================================
-- ML CREDIT SCORES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ml_credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Related entities
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Credit score prediction
  credit_score INTEGER NOT NULL CHECK (credit_score BETWEEN 300 AND 850),
  default_probability NUMERIC(5,4) NOT NULL CHECK (default_probability BETWEEN 0 AND 1),
  credit_tier VARCHAR(20) NOT NULL CHECK (credit_tier IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DECLINED')),
  max_loan_amount NUMERIC(15,2) NOT NULL,
  risk_category VARCHAR(20) NOT NULL CHECK (risk_category IN ('very_low', 'low', 'medium', 'high', 'very_high')),
  
  -- Model breakdown
  model_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  random_forest_score NUMERIC(5,4),
  gradient_boosting_score NUMERIC(5,4),
  logistic_regression_score NUMERIC(5,4),
  confidence_score NUMERIC(5,4) NOT NULL,
  
  -- Features used (for explainability)
  features_used JSONB NOT NULL,
  top_credit_factors JSONB,
  
  -- Credit analysis factors
  transaction_history_score NUMERIC(5,2),
  loan_repayment_rate NUMERIC(5,4),
  account_age_days INTEGER,
  monthly_income_estimate NUMERIC(15,2),
  monthly_transaction_count INTEGER,
  avg_balance NUMERIC(15,2),
  payment_consistency NUMERIC(5,4),
  debt_to_income_ratio NUMERIC(5,4),
  num_previous_loans INTEGER,
  default_history_count INTEGER,
  kyc_level INTEGER,
  account_activity_score NUMERIC(5,2),
  
  -- Recommendations
  recommendations JSONB,
  
  -- Loan application context
  loan_application_id UUID,
  requested_amount NUMERIC(15,2),
  approved BOOLEAN,
  approved_amount NUMERIC(15,2),
  
  -- Feedback loop
  actual_default BOOLEAN,
  feedback_provided_at TIMESTAMPTZ,
  model_correct BOOLEAN,
  
  -- Inference metadata
  inference_time_ms INTEGER,
  features_version VARCHAR(20) DEFAULT 'v1.0',
  
  -- Validity period (credit scores expire)
  valid_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  is_current BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ml_credit_user ON ml_credit_scores(user_id, scored_at DESC);
CREATE INDEX idx_ml_credit_current ON ml_credit_scores(user_id, is_current) WHERE is_current = true;
CREATE INDEX idx_ml_credit_tier ON ml_credit_scores(credit_tier, credit_score DESC);
CREATE INDEX idx_ml_credit_valid ON ml_credit_scores(valid_until) WHERE is_current = true;
CREATE INDEX idx_ml_credit_feedback ON ml_credit_scores(scored_at DESC) WHERE actual_default IS NULL;

-- ============================================================================
-- ML SPENDING PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ml_spending_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Related entities
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Spending segment prediction
  spending_segment VARCHAR(20) NOT NULL CHECK (spending_segment IN ('conservative', 'balanced', 'high_spender')),
  spending_pattern TEXT NOT NULL,
  confidence_score NUMERIC(5,4) NOT NULL,
  
  -- Model breakdown
  model_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  kmeans_prediction VARCHAR(20),
  random_forest_prediction VARCHAR(20),
  gradient_boosting_prediction VARCHAR(20),
  
  -- Spending analysis (monthly aggregates)
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  monthly_spending NUMERIC(15,2),
  transaction_count INTEGER,
  category_diversity NUMERIC(5,4),
  avg_transaction_size NUMERIC(15,2),
  
  -- Category breakdowns
  groceries_ratio NUMERIC(5,4),
  transport_ratio NUMERIC(5,4),
  utilities_ratio NUMERIC(5,4),
  entertainment_ratio NUMERIC(5,4),
  savings_rate NUMERIC(5,4),
  
  -- Features used
  features_used JSONB NOT NULL,
  
  -- Recommendations
  recommendations JSONB,
  budget_suggestions JSONB,
  
  -- Inference metadata
  inference_time_ms INTEGER,
  features_version VARCHAR(20) DEFAULT 'v1.0',
  
  -- Timestamps
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ml_spending_user ON ml_spending_predictions(user_id, predicted_at DESC);
CREATE INDEX idx_ml_spending_segment ON ml_spending_predictions(spending_segment, predicted_at DESC);
CREATE INDEX idx_ml_spending_period ON ml_spending_predictions(analysis_period_start, analysis_period_end);

-- ============================================================================
-- ML TRANSACTION CLASSIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ml_transaction_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Related entities
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Category prediction
  predicted_category VARCHAR(50) NOT NULL,
  confidence_score NUMERIC(5,4) NOT NULL,
  
  -- Top 3 category predictions
  top_categories JSONB NOT NULL,
  
  -- Model breakdown
  model_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  random_forest_category VARCHAR(50),
  gradient_boosting_category VARCHAR(50),
  logistic_regression_category VARCHAR(50),
  
  -- Features used
  features_used JSONB NOT NULL,
  
  -- User feedback
  user_confirmed_category VARCHAR(50),
  user_corrected_at TIMESTAMPTZ,
  model_correct BOOLEAN,
  
  -- Inference metadata
  inference_time_ms INTEGER,
  features_version VARCHAR(20) DEFAULT 'v1.0',
  
  -- Timestamps
  classified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ml_classification_transaction ON ml_transaction_classifications(transaction_id);
CREATE INDEX idx_ml_classification_user ON ml_transaction_classifications(user_id, classified_at DESC);
CREATE INDEX idx_ml_classification_category ON ml_transaction_classifications(predicted_category, classified_at DESC);
CREATE INDEX idx_ml_classification_feedback ON ml_transaction_classifications(classified_at DESC) 
  WHERE user_confirmed_category IS NULL;

-- ============================================================================
-- ML MODEL PERFORMANCE METRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ml_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Model identification
  model_name VARCHAR(50) NOT NULL,
  model_version VARCHAR(20) NOT NULL,
  model_type VARCHAR(30) NOT NULL CHECK (model_type IN (
    'fraud_detection',
    'credit_scoring',
    'spending_analysis',
    'transaction_classification'
  )),
  
  -- Performance metrics
  accuracy NUMERIC(5,4),
  precision_score NUMERIC(5,4),
  recall NUMERIC(5,4),
  f1_score NUMERIC(5,4),
  roc_auc NUMERIC(5,4),
  
  -- Confusion matrix
  true_positives INTEGER,
  false_positives INTEGER,
  true_negatives INTEGER,
  false_negatives INTEGER,
  
  -- Dataset info
  training_samples INTEGER,
  validation_samples INTEGER,
  test_samples INTEGER,
  
  -- Feature importance
  top_features JSONB,
  
  -- Training metadata
  training_date TIMESTAMPTZ NOT NULL,
  training_duration_seconds INTEGER,
  hyperparameters JSONB,
  
  -- Deployment
  deployed BOOLEAN NOT NULL DEFAULT false,
  deployed_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ml_performance_model ON ml_model_performance(model_type, model_version, training_date DESC);
CREATE INDEX idx_ml_performance_deployed ON ml_model_performance(model_type, deployed) WHERE deployed = true;

-- ============================================================================
-- ML FEATURE ENGINEERING CACHE TABLE
-- ============================================================================
-- Cache engineered features for faster inference
CREATE TABLE IF NOT EXISTS ml_feature_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entity
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('user', 'transaction')),
  entity_id UUID NOT NULL,
  
  -- Feature type
  feature_set VARCHAR(50) NOT NULL CHECK (feature_set IN (
    'fraud_detection',
    'credit_scoring',
    'spending_analysis',
    'transaction_classification'
  )),
  
  -- Cached features
  features JSONB NOT NULL,
  features_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  
  -- Cache control
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  computation_time_ms INTEGER,
  data_sources JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (entity_type, entity_id, feature_set, features_version)
);

CREATE INDEX idx_ml_cache_entity ON ml_feature_cache(entity_type, entity_id, feature_set);
CREATE INDEX idx_ml_cache_valid ON ml_feature_cache(entity_type, feature_set, is_valid) 
  WHERE is_valid = true AND expires_at > NOW();
CREATE INDEX idx_ml_cache_expires ON ml_feature_cache(expires_at) WHERE is_valid = true;

-- ============================================================================
-- VIEWS FOR ML ANALYTICS
-- ============================================================================

-- Fraud detection performance view
CREATE OR REPLACE VIEW vw_ml_fraud_performance AS
SELECT
  DATE(predicted_at) AS prediction_date,
  COUNT(*) AS total_predictions,
  COUNT(CASE WHEN is_fraud THEN 1 END) AS fraud_predictions,
  COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) AS critical_risk_predictions,
  COUNT(CASE WHEN transaction_blocked THEN 1 END) AS transactions_blocked,
  AVG(fraud_probability) AS avg_fraud_probability,
  AVG(confidence_score) AS avg_confidence,
  AVG(inference_time_ms) AS avg_inference_time_ms,
  COUNT(CASE WHEN actual_fraud IS NOT NULL THEN 1 END) AS feedback_count,
  COUNT(CASE WHEN model_correct = true THEN 1 END) AS correct_predictions,
  CASE 
    WHEN COUNT(CASE WHEN actual_fraud IS NOT NULL THEN 1 END) > 0 
    THEN COUNT(CASE WHEN model_correct = true THEN 1 END)::NUMERIC / 
         COUNT(CASE WHEN actual_fraud IS NOT NULL THEN 1 END)::NUMERIC
    ELSE NULL
  END AS accuracy_rate,
  COUNT(CASE WHEN card_not_present THEN 1 END) AS cnp_fraud_count,
  COUNT(CASE WHEN phone_scam_indicator THEN 1 END) AS phone_scam_count,
  COUNT(CASE WHEN phishing_indicator THEN 1 END) AS phishing_count,
  COUNT(CASE WHEN sim_swap_indicator THEN 1 END) AS sim_swap_count
FROM ml_fraud_predictions
WHERE predicted_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(predicted_at)
ORDER BY prediction_date DESC;

-- Credit scoring accuracy view
CREATE OR REPLACE VIEW vw_ml_credit_performance AS
SELECT
  DATE(scored_at) AS scoring_date,
  COUNT(*) AS total_scores,
  COUNT(CASE WHEN credit_tier = 'EXCELLENT' THEN 1 END) AS excellent_tier_count,
  COUNT(CASE WHEN credit_tier = 'GOOD' THEN 1 END) AS good_tier_count,
  COUNT(CASE WHEN credit_tier = 'FAIR' THEN 1 END) AS fair_tier_count,
  COUNT(CASE WHEN credit_tier = 'POOR' THEN 1 END) AS poor_tier_count,
  COUNT(CASE WHEN credit_tier = 'DECLINED' THEN 1 END) AS declined_count,
  AVG(credit_score) AS avg_credit_score,
  AVG(default_probability) AS avg_default_probability,
  AVG(confidence_score) AS avg_confidence,
  AVG(inference_time_ms) AS avg_inference_time_ms,
  COUNT(CASE WHEN actual_default IS NOT NULL THEN 1 END) AS feedback_count,
  COUNT(CASE WHEN model_correct = true THEN 1 END) AS correct_predictions,
  CASE 
    WHEN COUNT(CASE WHEN actual_default IS NOT NULL THEN 1 END) > 0 
    THEN COUNT(CASE WHEN model_correct = true THEN 1 END)::NUMERIC / 
         COUNT(CASE WHEN actual_default IS NOT NULL THEN 1 END)::NUMERIC
    ELSE NULL
  END AS accuracy_rate
FROM ml_credit_scores
WHERE scored_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(scored_at)
ORDER BY scoring_date DESC;

-- Spending analysis summary view
CREATE OR REPLACE VIEW vw_ml_spending_summary AS
SELECT
  user_id,
  spending_segment,
  monthly_spending,
  transaction_count,
  savings_rate,
  predicted_at,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY predicted_at DESC) AS rn
FROM ml_spending_predictions
WHERE predicted_at >= CURRENT_DATE - INTERVAL '90 days';

-- Current credit scores (most recent valid score per user)
CREATE OR REPLACE VIEW vw_current_credit_scores AS
SELECT
  user_id,
  credit_score,
  credit_tier,
  max_loan_amount,
  default_probability,
  risk_category,
  scored_at,
  valid_until
FROM ml_credit_scores
WHERE is_current = true
  AND valid_until > NOW();

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-expire old credit scores
CREATE OR REPLACE FUNCTION expire_old_credit_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new credit score is inserted, mark previous scores as not current
  UPDATE ml_credit_scores
  SET is_current = false
  WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_current = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expire_old_credit_scores
  AFTER INSERT ON ml_credit_scores
  FOR EACH ROW
  EXECUTE FUNCTION expire_old_credit_scores();

-- Auto-create alert for high-risk fraud predictions
CREATE OR REPLACE FUNCTION create_fraud_alert_from_ml()
RETURNS TRIGGER AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  -- Only create alert if fraud probability is high and not already created
  IF NEW.fraud_probability >= 0.7 AND NEW.alert_created = false THEN
    INSERT INTO transaction_monitoring_alerts (
      alert_type,
      severity,
      status,
      user_id,
      wallet_id,
      transaction_id,
      alert_reason,
      risk_score,
      confidence_level,
      detection_method,
      transaction_blocked
    ) VALUES (
      'unusual_pattern',
      CASE 
        WHEN NEW.fraud_probability >= 0.9 THEN 'critical'
        WHEN NEW.fraud_probability >= 0.8 THEN 'high'
        ELSE 'medium'
      END,
      'open',
      NEW.user_id,
      NEW.wallet_id,
      NEW.transaction_id,
      'ML model detected high fraud probability: ' || ROUND(NEW.fraud_probability * 100, 2) || '%',
      NEW.fraud_probability * 100,
      NEW.confidence_score * 100,
      'ml_model',
      NEW.transaction_blocked
    )
    RETURNING id INTO v_alert_id;
    
    -- Update prediction with alert ID
    NEW.alert_created := true;
    NEW.alert_id := v_alert_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_fraud_alert_from_ml
  BEFORE INSERT ON ml_fraud_predictions
  FOR EACH ROW
  EXECUTE FUNCTION create_fraud_alert_from_ml();

-- ============================================================================
-- FUNCTIONS FOR ML MODEL FEEDBACK
-- ============================================================================

-- Update fraud prediction with actual outcome
CREATE OR REPLACE FUNCTION update_fraud_prediction_feedback(
  p_prediction_id UUID,
  p_actual_fraud BOOLEAN,
  p_feedback_by UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE ml_fraud_predictions
  SET
    actual_fraud = p_actual_fraud,
    feedback_provided_at = NOW(),
    feedback_provided_by = p_feedback_by,
    model_correct = (is_fraud = p_actual_fraud)
  WHERE id = p_prediction_id;
  
  -- Log feedback for model retraining
  INSERT INTO ml_model_performance (
    model_name,
    model_version,
    model_type,
    training_date,
    notes
  ) VALUES (
    'fraud_detection_feedback',
    (SELECT model_version FROM ml_fraud_predictions WHERE id = p_prediction_id),
    'fraud_detection',
    NOW(),
    'Feedback received for prediction ' || p_prediction_id
  );
END;
$$ LANGUAGE plpgsql;

-- Update credit score prediction with actual outcome
CREATE OR REPLACE FUNCTION update_credit_score_feedback(
  p_score_id UUID,
  p_actual_default BOOLEAN,
  p_feedback_by UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE ml_credit_scores
  SET
    actual_default = p_actual_default,
    feedback_provided_at = NOW(),
    model_correct = (
      CASE 
        WHEN default_probability >= 0.5 THEN p_actual_default
        ELSE NOT p_actual_default
      END
    )
  WHERE id = p_score_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTIONS FOR QUERYING ML PREDICTIONS
-- ============================================================================

-- Get latest fraud prediction for transaction
CREATE OR REPLACE FUNCTION get_latest_fraud_prediction(p_transaction_id UUID)
RETURNS TABLE (
  fraud_probability NUMERIC,
  risk_level VARCHAR,
  recommendations TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mfp.fraud_probability,
    mfp.risk_level,
    ARRAY(
      SELECT jsonb_array_elements_text(
        COALESCE(mfp.top_fraud_indicators->'recommendations', '[]'::jsonb)
      )
    ) AS recommendations
  FROM ml_fraud_predictions mfp
  WHERE mfp.transaction_id = p_transaction_id
  ORDER BY mfp.predicted_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get current credit score for user
CREATE OR REPLACE FUNCTION get_current_credit_score(p_user_id UUID)
RETURNS TABLE (
  credit_score INTEGER,
  credit_tier VARCHAR,
  max_loan_amount NUMERIC,
  valid_until TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mcs.credit_score,
    mcs.credit_tier,
    mcs.max_loan_amount,
    mcs.valid_until
  FROM ml_credit_scores mcs
  WHERE mcs.user_id = p_user_id
    AND mcs.is_current = true
    AND mcs.valid_until > NOW()
  ORDER BY mcs.scored_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ml_fraud_predictions IS 'ML model predictions for real-time fraud detection with NPS fraud pattern features';
COMMENT ON TABLE ml_credit_scores IS 'ML model credit scores and risk assessments with 90-day validity';
COMMENT ON TABLE ml_spending_predictions IS 'ML model spending pattern predictions and budget recommendations';
COMMENT ON TABLE ml_transaction_classifications IS 'ML model automatic transaction category predictions';
COMMENT ON TABLE ml_model_performance IS 'ML model training metrics and performance tracking';
COMMENT ON TABLE ml_feature_cache IS 'Cached engineered features for faster ML inference';

COMMENT ON COLUMN ml_fraud_predictions.card_not_present IS 'NPS fraud indicator: Card-not-present transaction (95% of card fraud)';
COMMENT ON COLUMN ml_fraud_predictions.phone_scam_indicator IS 'NPS fraud indicator: Phone call scam pattern detected';
COMMENT ON COLUMN ml_fraud_predictions.phishing_indicator IS 'NPS fraud indicator: Phishing attack pattern (92.5% of EFT fraud)';
COMMENT ON COLUMN ml_fraud_predictions.sim_swap_indicator IS 'NPS fraud indicator: SIM swap attack pattern detected';

COMMENT ON FUNCTION get_latest_fraud_prediction IS 'Get the most recent ML fraud prediction for a transaction';
COMMENT ON FUNCTION get_current_credit_score IS 'Get the current valid ML credit score for a user';

-- Migration complete

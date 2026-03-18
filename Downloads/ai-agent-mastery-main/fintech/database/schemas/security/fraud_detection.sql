-- ============================================================================
-- FRAUD DETECTION SCHEMA - PSD-12 Compliance
-- Purpose: Track fraud detection activities based on 10-year fraud trends
-- Requirements: Section 11.6 - Monitor ALL payments for fraud
-- Fraud Patterns: Card-not-present, Phishing, SIM swap, etc.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- Fraud Rules Engine Configuration
CREATE TABLE fraud_detection_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL UNIQUE,
    rule_description TEXT,
    rule_type VARCHAR(100) NOT NULL, -- 'VELOCITY_CHECK', 'GEOLOCATION', 'DEVICE_FINGERPRINT', 'BEHAVIORAL', 'AMOUNT_THRESHOLD'
    
    -- Rule Configuration
    rule_category VARCHAR(100) NOT NULL, -- 'CARD_NOT_PRESENT', 'PHISHING', 'SIM_SWAP', 'COUNTERFEIT', 'VELOCITY', 'SUSPICIOUS_PATTERN'
    fraud_type VARCHAR(100), -- Based on NPS 10-year report categories
    
    -- Rule Logic (stored as JSONB for flexibility)
    rule_conditions JSONB NOT NULL, -- e.g., {"max_transactions_per_hour": 5, "max_amount_per_day": 50000}
    threshold_value DECIMAL(15,2),
    threshold_type VARCHAR(50), -- 'AMOUNT', 'COUNT', 'PERCENTAGE', 'TIME_WINDOW'
    
    -- Risk Scoring
    risk_score_weight DECIMAL(5,2) DEFAULT 1.0, -- Multiplier for risk calculation
    risk_score_points INTEGER NOT NULL, -- Points to add if rule is triggered
    
    -- Actions
    action_on_trigger VARCHAR(50) NOT NULL, -- 'BLOCK', 'REVIEW', 'ALERT', 'STEP_UP_AUTH', 'LOG_ONLY'
    requires_manual_review BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_ml_based BOOLEAN DEFAULT FALSE, -- TRUE if rule uses ML model
    ml_model_name VARCHAR(255),
    ml_confidence_threshold DECIMAL(5,2),
    
    -- Metadata
    created_by_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_action CHECK (action_on_trigger IN ('BLOCK', 'REVIEW', 'ALERT', 'STEP_UP_AUTH', 'LOG_ONLY'))
);

CREATE INDEX idx_fraud_rules_active ON fraud_detection_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_fraud_rules_category ON fraud_detection_rules(rule_category);
CREATE INDEX idx_fraud_rules_type ON fraud_detection_rules(rule_type);

-- Fraud Detection Events (Real-time fraud checks on all payments)
CREATE TABLE fraud_detection_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Transaction Reference
    payment_id UUID NOT NULL,
    transaction_id VARCHAR(255),
    
    -- Payment Details
    payment_type VARCHAR(50) NOT NULL, -- 'CARD', 'EFT', 'E_MONEY', 'QR_CODE'
    payment_method VARCHAR(100), -- 'CARD_NOT_PRESENT', 'CARD_PRESENT', 'MOBILE_MONEY', 'BANK_TRANSFER'
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NAD',
    
    -- Parties
    sender_id UUID,
    sender_account_id UUID,
    receiver_id UUID,
    receiver_account_id UUID,
    merchant_id UUID,
    
    -- Fraud Analysis Results
    fraud_check_status VARCHAR(50) NOT NULL, -- 'PASSED', 'FLAGGED', 'BLOCKED', 'REVIEWING'
    overall_risk_score DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
    risk_level VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    
    -- Rules Triggered
    rules_triggered JSONB, -- Array of rule IDs that were triggered
    rules_triggered_count INTEGER DEFAULT 0,
    
    -- Fraud Indicators
    fraud_indicators JSONB, -- Array of specific fraud indicators detected
    fraud_type_detected VARCHAR(100), -- 'CARD_NOT_PRESENT_FRAUD', 'PHISHING', 'SIM_SWAP', etc.
    
    -- Action Taken
    action_taken VARCHAR(50) NOT NULL, -- 'ALLOWED', 'BLOCKED', 'REVIEW_REQUIRED', 'STEP_UP_AUTH_REQUIRED'
    blocked_reason TEXT,
    
    -- Device & Location Context
    device_id VARCHAR(255),
    device_fingerprint TEXT,
    device_type VARCHAR(50), -- 'MOBILE', 'WEB', 'API', 'POS'
    ip_address INET,
    geo_location POINT, -- Latitude, Longitude
    geo_country VARCHAR(2),
    geo_city VARCHAR(100),
    
    -- Behavioral Analysis
    is_new_device BOOLEAN DEFAULT FALSE,
    is_new_location BOOLEAN DEFAULT FALSE,
    distance_from_last_transaction_km DECIMAL(10,2),
    time_since_last_transaction_seconds INTEGER,
    
    -- Card-Specific (for card transactions)
    card_type VARCHAR(50), -- 'DEBIT', 'CREDIT', 'PREPAID'
    card_last_four VARCHAR(4),
    card_bin VARCHAR(6), -- Bank Identification Number
    card_issuer VARCHAR(255),
    is_card_present BOOLEAN,
    
    -- ML Model Results (if applicable)
    ml_model_used VARCHAR(255),
    ml_prediction VARCHAR(50), -- 'FRAUD', 'LEGITIMATE', 'UNCERTAIN'
    ml_confidence_score DECIMAL(5,2), -- 0.00 to 100.00
    ml_features JSONB, -- Features used in ML prediction
    
    -- Manual Review
    requires_manual_review BOOLEAN DEFAULT FALSE,
    reviewed_by_user_id UUID,
    reviewed_at TIMESTAMPTZ,
    review_decision VARCHAR(50), -- 'APPROVED', 'REJECTED', 'ESCALATED'
    review_notes TEXT,
    
    -- False Positive Tracking
    is_false_positive BOOLEAN,
    false_positive_reported_at TIMESTAMPTZ,
    false_positive_reason TEXT,
    
    -- Metadata
    metadata JSONB,
    
    CONSTRAINT valid_fraud_check_status CHECK (fraud_check_status IN ('PASSED', 'FLAGGED', 'BLOCKED', 'REVIEWING')),
    CONSTRAINT valid_risk_level CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT valid_action_taken CHECK (action_taken IN ('ALLOWED', 'BLOCKED', 'REVIEW_REQUIRED', 'STEP_UP_AUTH_REQUIRED'))
);

CREATE INDEX idx_fraud_events_timestamp ON fraud_detection_events(timestamp DESC);
CREATE INDEX idx_fraud_events_payment_id ON fraud_detection_events(payment_id);
CREATE INDEX idx_fraud_events_sender_id ON fraud_detection_events(sender_id);
CREATE INDEX idx_fraud_events_risk_score ON fraud_detection_events(overall_risk_score DESC);
CREATE INDEX idx_fraud_events_blocked ON fraud_detection_events(action_taken) WHERE action_taken = 'BLOCKED';
CREATE INDEX idx_fraud_events_review_required ON fraud_detection_events(requires_manual_review) WHERE requires_manual_review = TRUE;
CREATE INDEX idx_fraud_events_false_positive ON fraud_detection_events(is_false_positive) WHERE is_false_positive = TRUE;

-- User Behavioral Profiles (Track normal behavior for anomaly detection)
CREATE TABLE user_behavioral_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    
    -- Transaction Patterns
    avg_transaction_amount DECIMAL(15,2),
    max_transaction_amount DECIMAL(15,2),
    typical_transaction_count_per_day INTEGER,
    typical_transaction_count_per_week INTEGER,
    
    -- Time Patterns
    typical_transaction_hours JSONB, -- Array of hours when user typically transacts
    typical_days_of_week JSONB, -- Array of days
    
    -- Location Patterns
    common_locations JSONB, -- Array of common geo locations
    common_countries JSONB,
    home_location POINT,
    
    -- Device Patterns
    known_devices JSONB, -- Array of known device IDs
    known_ip_addresses JSONB,
    
    -- Recipient Patterns
    frequent_recipients JSONB, -- Array of frequent recipient IDs
    
    -- Risk History
    total_fraud_flags INTEGER DEFAULT 0,
    total_blocked_transactions INTEGER DEFAULT 0,
    false_positive_rate DECIMAL(5,2),
    
    -- Trust Score
    trust_score DECIMAL(5,2) DEFAULT 50.0, -- 0 to 100, starts at 50
    trust_level VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'TRUSTED'
    
    -- Last Updated
    profile_last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transaction_count_for_profile INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB,
    
    CONSTRAINT valid_trust_level CHECK (trust_level IN ('LOW', 'MEDIUM', 'HIGH', 'TRUSTED'))
);

CREATE INDEX idx_behavioral_profiles_user_id ON user_behavioral_profiles(user_id);
CREATE INDEX idx_behavioral_profiles_trust_score ON user_behavioral_profiles(trust_score);
CREATE INDEX idx_behavioral_profiles_trust_level ON user_behavioral_profiles(trust_level);

-- Velocity Tracking (Track transaction velocity to detect unusual patterns)
CREATE TABLE velocity_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User
    user_id UUID NOT NULL,
    
    -- Velocity Metrics
    transactions_last_1_hour INTEGER DEFAULT 0,
    transactions_last_24_hours INTEGER DEFAULT 0,
    transactions_last_7_days INTEGER DEFAULT 0,
    
    amount_last_1_hour DECIMAL(15,2) DEFAULT 0,
    amount_last_24_hours DECIMAL(15,2) DEFAULT 0,
    amount_last_7_days DECIMAL(15,2) DEFAULT 0,
    
    -- Failed Transactions
    failed_transactions_last_1_hour INTEGER DEFAULT 0,
    failed_transactions_last_24_hours INTEGER DEFAULT 0,
    
    -- Unique Recipients
    unique_recipients_last_24_hours INTEGER DEFAULT 0,
    unique_recipients_last_7_days INTEGER DEFAULT 0,
    
    -- Device Changes
    device_changes_last_24_hours INTEGER DEFAULT 0,
    
    -- Velocity Alerts
    velocity_alerts_triggered JSONB,
    
    UNIQUE(user_id, timestamp)
);

CREATE INDEX idx_velocity_user_id ON velocity_tracking(user_id);
CREATE INDEX idx_velocity_timestamp ON velocity_tracking(timestamp DESC);

-- Device Fingerprinting (Track devices for fraud detection)
CREATE TABLE device_fingerprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Device Details
    device_type VARCHAR(50), -- 'MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN'
    operating_system VARCHAR(100),
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    
    -- Fingerprint Components
    screen_resolution VARCHAR(50),
    timezone VARCHAR(100),
    language VARCHAR(10),
    plugins JSONB,
    canvas_fingerprint VARCHAR(64), -- Hash of canvas rendering
    webgl_fingerprint VARCHAR(64), -- Hash of WebGL rendering
    
    -- Associated Users
    associated_users JSONB, -- Array of user IDs that have used this device
    user_count INTEGER DEFAULT 0,
    
    -- Risk Assessment
    is_suspicious BOOLEAN DEFAULT FALSE,
    suspicion_reasons JSONB,
    risk_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- First/Last Seen
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Geolocation History
    last_known_location POINT,
    last_known_ip INET,
    location_history JSONB,
    
    -- Metadata
    metadata JSONB
);

CREATE INDEX idx_device_fingerprints_device_id ON device_fingerprints(device_id);
CREATE INDEX idx_device_fingerprints_suspicious ON device_fingerprints(is_suspicious) WHERE is_suspicious = TRUE;
CREATE INDEX idx_device_fingerprints_risk_score ON device_fingerprints(risk_score DESC);

-- Fraud Patterns Library (Known fraud patterns from 10-year NPS report)
CREATE TABLE fraud_patterns_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(100) NOT NULL, -- 'CARD_NOT_PRESENT', 'PHISHING', 'SIM_SWAP', 'COUNTERFEIT', 'SOCIAL_ENGINEERING'
    
    -- Pattern Description
    description TEXT NOT NULL,
    indicators JSONB NOT NULL, -- Array of indicators that match this pattern
    
    -- Pattern Statistics (from historical data)
    total_occurrences INTEGER DEFAULT 0,
    avg_loss_per_incident DECIMAL(15,2),
    detection_rate DECIMAL(5,2), -- Percentage of incidents detected
    
    -- Detection Strategy
    detection_methods JSONB, -- Methods to detect this pattern
    recommended_actions JSONB, -- Recommended actions when detected
    
    -- Prevention Measures
    prevention_measures JSONB,
    
    -- References
    nps_report_reference TEXT, -- Reference to NPS 10-year fraud report section
    source VARCHAR(100), -- 'NPS_10_YEAR_REPORT', 'PAN', 'INTERNAL_ANALYSIS'
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB
);

CREATE INDEX idx_fraud_patterns_type ON fraud_patterns_library(pattern_type);
CREATE INDEX idx_fraud_patterns_active ON fraud_patterns_library(is_active) WHERE is_active = TRUE;

-- Whitelists and Blacklists
CREATE TABLE fraud_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_type VARCHAR(50) NOT NULL, -- 'WHITELIST', 'BLACKLIST'
    entry_type VARCHAR(50) NOT NULL, -- 'USER', 'DEVICE', 'IP_ADDRESS', 'CARD_BIN', 'PHONE_NUMBER', 'EMAIL'
    
    -- Entry Details
    entry_value VARCHAR(255) NOT NULL,
    entry_hash VARCHAR(64), -- Hashed value for privacy
    
    -- Reason
    reason TEXT NOT NULL,
    added_by_user_id UUID,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    is_permanent BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    metadata JSONB,
    
    CONSTRAINT valid_list_type CHECK (list_type IN ('WHITELIST', 'BLACKLIST')),
    CONSTRAINT valid_entry_type CHECK (entry_type IN ('USER', 'DEVICE', 'IP_ADDRESS', 'CARD_BIN', 'PHONE_NUMBER', 'EMAIL', 'MERCHANT'))
);

CREATE INDEX idx_fraud_lists_type ON fraud_lists(list_type, entry_type);
CREATE INDEX idx_fraud_lists_active ON fraud_lists(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_fraud_lists_entry ON fraud_lists(entry_value);

-- View: High-Risk Transactions (For manual review queue)
CREATE VIEW high_risk_transactions AS
SELECT 
    fde.id,
    fde.timestamp,
    fde.payment_id,
    fde.payment_type,
    fde.amount,
    fde.sender_id,
    fde.overall_risk_score,
    fde.risk_level,
    fde.fraud_type_detected,
    fde.action_taken,
    fde.requires_manual_review,
    fde.reviewed_at,
    fde.rules_triggered_count,
    fde.fraud_indicators
FROM fraud_detection_events fde
WHERE 
    fde.requires_manual_review = TRUE
    AND fde.reviewed_at IS NULL
ORDER BY fde.overall_risk_score DESC, fde.timestamp ASC;

-- View: Fraud Detection Statistics (Last 30 days)
CREATE VIEW fraud_detection_statistics AS
WITH recent_events AS (
    SELECT *
    FROM fraud_detection_events
    WHERE timestamp > NOW() - INTERVAL '30 days'
)
SELECT 
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE action_taken = 'BLOCKED') as blocked_count,
    COUNT(*) FILTER (WHERE action_taken = 'ALLOWED') as allowed_count,
    COUNT(*) FILTER (WHERE requires_manual_review = TRUE) as manual_review_count,
    COUNT(*) FILTER (WHERE is_false_positive = TRUE) as false_positive_count,
    
    ROUND(AVG(overall_risk_score), 2) as avg_risk_score,
    
    COUNT(*) FILTER (WHERE risk_level = 'CRITICAL') as critical_risk_count,
    COUNT(*) FILTER (WHERE risk_level = 'HIGH') as high_risk_count,
    COUNT(*) FILTER (WHERE risk_level = 'MEDIUM') as medium_risk_count,
    COUNT(*) FILTER (WHERE risk_level = 'LOW') as low_risk_count,
    
    SUM(amount) FILTER (WHERE action_taken = 'BLOCKED') as total_blocked_amount,
    
    ROUND((COUNT(*) FILTER (WHERE action_taken = 'BLOCKED')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) as block_rate,
    ROUND((COUNT(*) FILTER (WHERE is_false_positive = TRUE)::DECIMAL / NULLIF(COUNT(*) FILTER (WHERE action_taken = 'BLOCKED'), 0)) * 100, 2) as false_positive_rate
FROM recent_events;

-- View: Fraud by Type (Based on NPS 10-year report categories)
CREATE VIEW fraud_by_type_statistics AS
SELECT 
    fraud_type_detected,
    COUNT(*) as incident_count,
    SUM(amount) as total_amount,
    AVG(overall_risk_score) as avg_risk_score,
    COUNT(*) FILTER (WHERE action_taken = 'BLOCKED') as blocked_count,
    COUNT(*) FILTER (WHERE is_false_positive = TRUE) as false_positive_count
FROM fraud_detection_events
WHERE 
    timestamp > NOW() - INTERVAL '30 days'
    AND fraud_type_detected IS NOT NULL
GROUP BY fraud_type_detected
ORDER BY incident_count DESC;

-- Function: Calculate fraud risk score
CREATE OR REPLACE FUNCTION calculate_fraud_risk_score(
    p_payment_id UUID,
    p_user_id UUID,
    p_amount DECIMAL,
    p_device_id VARCHAR,
    p_ip_address INET,
    p_location POINT
)
RETURNS DECIMAL AS $$
DECLARE
    v_risk_score DECIMAL(5,2) := 0.0;
    v_user_profile RECORD;
    v_velocity RECORD;
    v_device RECORD;
BEGIN
    -- Get user behavioral profile
    SELECT * INTO v_user_profile
    FROM user_behavioral_profiles
    WHERE user_id = p_user_id;
    
    -- Check amount vs typical
    IF v_user_profile.avg_transaction_amount IS NOT NULL THEN
        IF p_amount > v_user_profile.avg_transaction_amount * 3 THEN
            v_risk_score := v_risk_score + 20.0;
        ELSIF p_amount > v_user_profile.avg_transaction_amount * 2 THEN
            v_risk_score := v_risk_score + 10.0;
        END IF;
    END IF;
    
    -- Check velocity
    SELECT * INTO v_velocity
    FROM velocity_tracking
    WHERE user_id = p_user_id
    ORDER BY timestamp DESC
    LIMIT 1;
    
    IF v_velocity.transactions_last_1_hour >= 5 THEN
        v_risk_score := v_risk_score + 30.0;
    ELSIF v_velocity.transactions_last_1_hour >= 3 THEN
        v_risk_score := v_risk_score + 15.0;
    END IF;
    
    -- Check device
    SELECT * INTO v_device
    FROM device_fingerprints
    WHERE device_id = p_device_id;
    
    IF v_device.is_suspicious THEN
        v_risk_score := v_risk_score + 40.0;
    ELSIF NOT EXISTS (
        SELECT 1 FROM device_fingerprints 
        WHERE device_id = p_device_id
    ) THEN
        -- New device
        v_risk_score := v_risk_score + 15.0;
    END IF;
    
    -- Cap at 100
    IF v_risk_score > 100 THEN
        v_risk_score := 100.0;
    END IF;
    
    RETURN v_risk_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE fraud_detection_rules IS 'Fraud detection rules engine - PSD-12 Section 11.6 requires monitoring ALL payments for fraud';
COMMENT ON TABLE fraud_detection_events IS 'Real-time fraud detection events - tracks all payment fraud checks';
COMMENT ON TABLE fraud_patterns_library IS 'Known fraud patterns from NPS 10-year fraud report (2013-2022)';
COMMENT ON TABLE user_behavioral_profiles IS 'User behavioral profiles for anomaly detection';

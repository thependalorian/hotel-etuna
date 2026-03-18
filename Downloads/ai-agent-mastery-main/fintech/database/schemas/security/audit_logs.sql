-- ============================================================================
-- AUDIT LOGS SCHEMA - PSD-12 Compliance
-- Purpose: Immutable audit trail for all system activities
-- Requirement: Section 11.6 - Continuous monitoring and detection
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Audit Logs Table (Immutable)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL, -- 'AUTHENTICATION', 'PAYMENT', 'ACCESS', 'CONFIGURATION', 'SECURITY'
    severity VARCHAR(20) NOT NULL, -- 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
    
    -- User/Actor Information
    user_id UUID,
    user_email VARCHAR(255),
    user_ip_address INET,
    user_agent TEXT,
    session_id UUID,
    
    -- Action Details
    action VARCHAR(100) NOT NULL, -- 'LOGIN', 'PAYMENT_INITIATED', 'DATA_ACCESS', etc.
    resource_type VARCHAR(100), -- 'WALLET', 'CARD', 'TRANSACTION', 'USER', etc.
    resource_id UUID,
    
    -- Request/Response Details
    request_method VARCHAR(10), -- 'GET', 'POST', 'PUT', 'DELETE'
    request_path TEXT,
    request_body JSONB,
    response_status_code INTEGER,
    response_body JSONB,
    
    -- Security Context
    authentication_method VARCHAR(50), -- 'PASSWORD', '2FA_SMS', '2FA_TOTP', 'BIOMETRIC'
    authentication_success BOOLEAN,
    risk_score DECIMAL(5,2), -- 0.00 to 100.00
    fraud_flags JSONB, -- Array of fraud detection flags
    
    -- Additional Context
    metadata JSONB, -- Flexible field for additional data
    correlation_id UUID, -- For tracking related events
    
    -- Data Integrity
    checksum VARCHAR(64) NOT NULL, -- SHA-256 hash for tamper detection
    
    -- Constraints
    CONSTRAINT valid_severity CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    CONSTRAINT valid_category CHECK (event_category IN ('AUTHENTICATION', 'PAYMENT', 'ACCESS', 'CONFIGURATION', 'SECURITY', 'FRAUD'))
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_event_category ON audit_logs(event_category);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_correlation_id ON audit_logs(correlation_id);
CREATE INDEX idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX idx_audit_logs_risk_score ON audit_logs(risk_score) WHERE risk_score > 50.0;

-- GIN index for JSONB fields
CREATE INDEX idx_audit_logs_fraud_flags ON audit_logs USING GIN(fraud_flags);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN(metadata);

-- Prevent updates and deletes (immutable logs)
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_log_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER prevent_audit_log_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- Generate checksum automatically
CREATE OR REPLACE FUNCTION generate_audit_log_checksum()
RETURNS TRIGGER AS $$
BEGIN
    NEW.checksum := encode(
        digest(
            COALESCE(NEW.timestamp::TEXT, '') ||
            COALESCE(NEW.event_type, '') ||
            COALESCE(NEW.user_id::TEXT, '') ||
            COALESCE(NEW.action, '') ||
            COALESCE(NEW.resource_type, '') ||
            COALESCE(NEW.resource_id::TEXT, ''),
            'sha256'
        ),
        'hex'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_checksum_before_insert
    BEFORE INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION generate_audit_log_checksum();

-- Payment Audit Trail (Specific for payment transactions)
CREATE TABLE payment_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_log_id UUID NOT NULL REFERENCES audit_logs(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Payment Details
    payment_id UUID NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- 'CARD', 'EFT', 'E_MONEY', 'QR_CODE'
    payment_status VARCHAR(50) NOT NULL, -- 'INITIATED', 'PENDING_2FA', 'AUTHORIZED', 'COMPLETED', 'FAILED', 'BLOCKED'
    
    -- Transaction Amounts
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
    
    -- Parties
    sender_id UUID,
    sender_wallet_id UUID,
    receiver_id UUID,
    receiver_wallet_id UUID,
    
    -- 2FA Compliance (Section 12.2 - Required for EVERY payment)
    two_factor_auth_required BOOLEAN NOT NULL DEFAULT TRUE,
    two_factor_auth_method VARCHAR(50), -- 'SMS_OTP', 'TOTP', 'BIOMETRIC', 'HARDWARE_TOKEN'
    two_factor_auth_success BOOLEAN,
    two_factor_auth_attempts INTEGER DEFAULT 0,
    
    -- Fraud Detection
    fraud_check_performed BOOLEAN NOT NULL DEFAULT TRUE,
    fraud_risk_score DECIMAL(5,2), -- 0.00 to 100.00
    fraud_rules_triggered JSONB, -- Array of triggered fraud rules
    fraud_action_taken VARCHAR(50), -- 'ALLOWED', 'BLOCKED', 'REVIEW_REQUIRED'
    
    -- Device Information
    device_id VARCHAR(255),
    device_fingerprint TEXT,
    device_location POINT, -- Geographic coordinates
    device_ip_address INET,
    
    -- Additional Context
    metadata JSONB,
    
    CONSTRAINT valid_payment_type CHECK (payment_type IN ('CARD', 'EFT', 'E_MONEY', 'QR_CODE', 'BANK_TRANSFER')),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('INITIATED', 'PENDING_2FA', 'AUTHORIZED', 'COMPLETED', 'FAILED', 'BLOCKED', 'CANCELLED'))
);

CREATE INDEX idx_payment_audit_payment_id ON payment_audit_trail(payment_id);
CREATE INDEX idx_payment_audit_timestamp ON payment_audit_trail(timestamp DESC);
CREATE INDEX idx_payment_audit_sender_id ON payment_audit_trail(sender_id);
CREATE INDEX idx_payment_audit_fraud_score ON payment_audit_trail(fraud_risk_score) WHERE fraud_risk_score > 70.0;
CREATE INDEX idx_payment_audit_2fa_failed ON payment_audit_trail(two_factor_auth_success) WHERE two_factor_auth_success = FALSE;

-- 2FA Authentication Logs (Section 12.2 compliance)
CREATE TABLE two_factor_auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_log_id UUID REFERENCES audit_logs(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User Information
    user_id UUID NOT NULL,
    session_id UUID,
    
    -- Authentication Details
    auth_method VARCHAR(50) NOT NULL, -- 'SMS_OTP', 'TOTP', 'BIOMETRIC', 'HARDWARE_TOKEN'
    auth_purpose VARCHAR(100) NOT NULL, -- 'PAYMENT', 'LOGIN', 'PASSWORD_RESET', 'SETTINGS_CHANGE'
    auth_success BOOLEAN NOT NULL,
    auth_attempts INTEGER DEFAULT 1,
    
    -- OTP Details (if applicable)
    otp_code_hash VARCHAR(64), -- Hashed OTP for verification
    otp_sent_to VARCHAR(255), -- Phone number or email (masked)
    otp_expires_at TIMESTAMPTZ,
    
    -- Failure Details
    failure_reason VARCHAR(255),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    device_id VARCHAR(255),
    
    CONSTRAINT valid_auth_method CHECK (auth_method IN ('SMS_OTP', 'TOTP', 'BIOMETRIC', 'HARDWARE_TOKEN', 'EMAIL_OTP'))
);

CREATE INDEX idx_2fa_logs_user_id ON two_factor_auth_logs(user_id);
CREATE INDEX idx_2fa_logs_timestamp ON two_factor_auth_logs(timestamp DESC);
CREATE INDEX idx_2fa_logs_success ON two_factor_auth_logs(auth_success);
CREATE INDEX idx_2fa_logs_failed_attempts ON two_factor_auth_logs(user_id, auth_success) WHERE auth_success = FALSE;

-- Data Access Logs (Track all data access for compliance)
CREATE TABLE data_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_log_id UUID REFERENCES audit_logs(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Accessor Information
    user_id UUID NOT NULL,
    user_role VARCHAR(100),
    
    -- Data Accessed
    data_type VARCHAR(100) NOT NULL, -- 'PII', 'PAYMENT_DATA', 'CARD_DATA', 'TRANSACTION_HISTORY'
    data_classification VARCHAR(50) NOT NULL, -- 'PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'
    record_ids JSONB, -- Array of accessed record IDs
    
    -- Access Details
    access_type VARCHAR(50) NOT NULL, -- 'READ', 'WRITE', 'UPDATE', 'DELETE', 'EXPORT'
    access_granted BOOLEAN NOT NULL,
    denial_reason VARCHAR(255),
    
    -- Context
    ip_address INET,
    application VARCHAR(100),
    
    CONSTRAINT valid_data_classification CHECK (data_classification IN ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED')),
    CONSTRAINT valid_access_type CHECK (access_type IN ('READ', 'WRITE', 'UPDATE', 'DELETE', 'EXPORT'))
);

CREATE INDEX idx_data_access_user_id ON data_access_logs(user_id);
CREATE INDEX idx_data_access_timestamp ON data_access_logs(timestamp DESC);
CREATE INDEX idx_data_access_data_type ON data_access_logs(data_type);
CREATE INDEX idx_data_access_denied ON data_access_logs(access_granted) WHERE access_granted = FALSE;

-- System Configuration Changes (Track all configuration changes)
CREATE TABLE configuration_change_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_log_id UUID REFERENCES audit_logs(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Change Details
    changed_by_user_id UUID NOT NULL,
    change_type VARCHAR(100) NOT NULL, -- 'SECURITY_SETTING', 'PAYMENT_RULE', 'USER_PERMISSION', 'SYSTEM_CONFIG'
    
    -- Before/After State
    configuration_key VARCHAR(255) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    
    -- Approval (if required)
    approval_required BOOLEAN DEFAULT FALSE,
    approved_by_user_id UUID,
    approved_at TIMESTAMPTZ,
    
    -- Context
    change_reason TEXT,
    ip_address INET
);

CREATE INDEX idx_config_change_timestamp ON configuration_change_logs(timestamp DESC);
CREATE INDEX idx_config_change_user ON configuration_change_logs(changed_by_user_id);
CREATE INDEX idx_config_change_pending_approval ON configuration_change_logs(approval_required, approved_at) WHERE approval_required = TRUE AND approved_at IS NULL;

-- View: Recent High-Risk Activities
CREATE VIEW high_risk_activities AS
SELECT 
    al.id,
    al.timestamp,
    al.event_type,
    al.event_category,
    al.severity,
    al.user_id,
    al.user_email,
    al.action,
    al.risk_score,
    al.fraud_flags,
    al.authentication_success
FROM audit_logs al
WHERE 
    al.risk_score > 70.0 
    OR al.severity = 'CRITICAL'
    OR (al.event_category = 'PAYMENT' AND al.authentication_success = FALSE)
ORDER BY al.timestamp DESC;

-- View: Failed Authentication Attempts (Monitor for brute force attacks)
CREATE VIEW failed_authentication_attempts AS
SELECT 
    user_id,
    user_email,
    user_ip_address,
    COUNT(*) as failed_attempts,
    MAX(timestamp) as last_attempt,
    MIN(timestamp) as first_attempt,
    ARRAY_AGG(DISTINCT authentication_method) as methods_tried
FROM audit_logs
WHERE 
    event_category = 'AUTHENTICATION'
    AND authentication_success = FALSE
    AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user_id, user_email, user_ip_address
HAVING COUNT(*) >= 3
ORDER BY failed_attempts DESC;

-- View: Payment Transactions Without 2FA (VIOLATION of Section 12.2)
CREATE VIEW payments_without_2fa AS
SELECT 
    pat.id,
    pat.timestamp,
    pat.payment_id,
    pat.payment_type,
    pat.amount,
    pat.sender_id,
    pat.receiver_id,
    pat.two_factor_auth_required,
    pat.two_factor_auth_success
FROM payment_audit_trail pat
WHERE 
    pat.two_factor_auth_required = FALSE
    OR (pat.two_factor_auth_required = TRUE AND pat.two_factor_auth_success = FALSE)
ORDER BY pat.timestamp DESC;

-- Function: Query audit logs by date range
CREATE OR REPLACE FUNCTION get_audit_logs_by_date_range(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    p_event_category VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    log_id UUID,
    timestamp TIMESTAMPTZ,
    event_type VARCHAR,
    event_category VARCHAR,
    severity VARCHAR,
    user_id UUID,
    action VARCHAR,
    risk_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.timestamp,
        al.event_type,
        al.event_category,
        al.severity,
        al.user_id,
        al.action,
        al.risk_score
    FROM audit_logs al
    WHERE 
        al.timestamp BETWEEN start_date AND end_date
        AND (p_event_category IS NULL OR al.event_category = p_event_category)
    ORDER BY al.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get payment audit trail for a specific user
CREATE OR REPLACE FUNCTION get_user_payment_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    payment_id UUID,
    timestamp TIMESTAMPTZ,
    payment_type VARCHAR,
    payment_status VARCHAR,
    amount DECIMAL,
    two_factor_auth_success BOOLEAN,
    fraud_risk_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pat.payment_id,
        pat.timestamp,
        pat.payment_type,
        pat.payment_status,
        pat.amount,
        pat.two_factor_auth_success,
        pat.fraud_risk_score
    FROM payment_audit_trail pat
    WHERE 
        pat.sender_id = p_user_id OR pat.receiver_id = p_user_id
    ORDER BY pat.timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create a partition strategy for audit_logs (for scalability)
-- Partition by month to improve query performance
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE audit_logs_2026_03 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Note: Create additional partitions as needed

-- Grant permissions (adjust based on your security model)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
-- GRANT SELECT, INSERT ON audit_logs TO app_user;
-- REVOKE UPDATE, DELETE ON audit_logs FROM app_user;

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all system activities - PSD-12 Section 11.6';
COMMENT ON TABLE payment_audit_trail IS 'Detailed audit trail for all payment transactions with 2FA compliance tracking - PSD-12 Section 12.2';
COMMENT ON TABLE two_factor_auth_logs IS 'Track all 2FA authentication attempts - PSD-12 Section 12.2 requires 2FA for EVERY payment';
COMMENT ON TABLE data_access_logs IS 'Track access to sensitive data for compliance and security monitoring';
COMMENT ON TABLE configuration_change_logs IS 'Track all system configuration changes for audit purposes';

-- ============================================================================
-- E-MONEY DATABASE SCHEMAS - NAMIBIA REGULATORY COMPLIANCE
-- Based on PSD-3 and Payment System Notice 2025
-- ============================================================================

-- ============================================================================
-- 1. USERS & KYC
-- ============================================================================

CREATE TYPE kyc_tier AS ENUM ('lite', 'full');
CREATE TYPE user_type AS ENUM ('individual', 'business');
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'under_review');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    user_type user_type NOT NULL DEFAULT 'individual',
    kyc_tier kyc_tier NOT NULL DEFAULT 'lite',
    kyc_status kyc_status NOT NULL DEFAULT 'pending',
    
    -- Lite KYC fields
    full_name VARCHAR(255) NOT NULL,
    nationality VARCHAR(100),
    id_number VARCHAR(50), -- National ID or Passport
    company_registration VARCHAR(100), -- For businesses
    
    -- Full KYC fields (NULL for Lite KYC)
    residential_address TEXT,
    contact_telephone VARCHAR(20),
    contact_mobile VARCHAR(20),
    contact_email VARCHAR(255),
    business_nature TEXT, -- For businesses
    business_location TEXT, -- For businesses
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Compliance flags
    is_active BOOLEAN DEFAULT TRUE,
    is_pep BOOLEAN DEFAULT FALSE, -- Politically Exposed Person
    aml_risk_score INTEGER DEFAULT 0, -- 0-100
    
    CONSTRAINT valid_phone CHECK (phone_number ~ '^\+264[0-9]{9}$') -- Namibian format
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_kyc_tier ON users(kyc_tier);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- ============================================================================
-- 2. KYC VERIFICATIONS
-- ============================================================================

CREATE TYPE kyc_document_type AS ENUM (
    'national_id',
    'passport',
    'proof_of_residence',
    'business_registration',
    'selfie',
    'other'
);

CREATE TABLE kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_tier kyc_tier NOT NULL,
    status kyc_status NOT NULL DEFAULT 'pending',
    
    -- Documents submitted
    documents JSONB DEFAULT '[]'::jsonb, -- Array of document objects
    
    -- Verification details
    verified_by UUID, -- Admin user ID
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- AML/CFT checks
    aml_check_passed BOOLEAN,
    aml_check_details JSONB,
    sanctions_check_passed BOOLEAN,
    pep_check_passed BOOLEAN,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kyc_user ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_status ON kyc_verifications(status);
CREATE INDEX idx_kyc_submitted_at ON kyc_verifications(submitted_at);

-- ============================================================================
-- 3. E-MONEY WALLETS
-- ============================================================================

CREATE TYPE wallet_status AS ENUM ('active', 'dormant', 'suspended', 'terminated');

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_number VARCHAR(50) UNIQUE NOT NULL, -- Unique wallet identifier
    
    -- Balance (in cents to avoid floating point issues)
    balance_cents BIGINT NOT NULL DEFAULT 0,
    
    -- Limits based on KYC tier (cached for performance)
    daily_limit_cents BIGINT NOT NULL,
    monthly_balance_limit_cents BIGINT NOT NULL,
    
    -- Status
    status wallet_status NOT NULL DEFAULT 'active',
    
    -- Dormancy tracking
    last_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dormancy_warning_sent_at TIMESTAMP WITH TIME ZONE,
    marked_dormant_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_balance CHECK (balance_cents >= 0),
    CONSTRAINT valid_limits CHECK (daily_limit_cents > 0 AND monthly_balance_limit_cents > 0)
);

CREATE UNIQUE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_number ON wallets(wallet_number);
CREATE INDEX idx_wallets_status ON wallets(status);
CREATE INDEX idx_wallets_last_transaction ON wallets(last_transaction_at);

-- ============================================================================
-- 4. TRANSACTIONS
-- ============================================================================

CREATE TYPE transaction_type AS ENUM (
    'load',           -- Cash in / top up
    'transfer_out',   -- P2P send
    'transfer_in',    -- P2P receive
    'payment',        -- P2M payment
    'redemption',     -- Cash out / withdrawal
    'reversal',       -- Transaction reversal
    'fee',            -- Fee deduction
    'refund'          -- Refund
);

CREATE TYPE transaction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'reversed'
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref VARCHAR(50) UNIQUE NOT NULL, -- External reference
    
    -- Parties
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    counterparty_wallet_id UUID REFERENCES wallets(id), -- NULL for load/redemption
    
    -- Transaction details
    type transaction_type NOT NULL,
    amount_cents BIGINT NOT NULL,
    fee_cents BIGINT NOT NULL DEFAULT 0,
    total_cents BIGINT NOT NULL, -- amount + fee
    
    -- Balance tracking
    balance_before_cents BIGINT NOT NULL,
    balance_after_cents BIGINT NOT NULL,
    
    -- Status
    status transaction_status NOT NULL DEFAULT 'pending',
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional data (merchant info, etc.)
    
    -- Reversal tracking
    reversal_of UUID REFERENCES transactions(id),
    reversed_by UUID REFERENCES transactions(id),
    reversal_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Compliance
    aml_flagged BOOLEAN DEFAULT FALSE,
    aml_flag_reason TEXT,
    
    CONSTRAINT positive_amount CHECK (amount_cents > 0),
    CONSTRAINT valid_total CHECK (total_cents = amount_cents + fee_cents)
);

CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_counterparty ON transactions(counterparty_wallet_id);
CREATE INDEX idx_transactions_ref ON transactions(transaction_ref);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_aml_flagged ON transactions(aml_flagged) WHERE aml_flagged = TRUE;

-- ============================================================================
-- 5. DAILY TRANSACTION LIMITS TRACKING
-- ============================================================================

CREATE TABLE daily_transaction_totals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Totals in cents (excluding fees)
    total_load_cents BIGINT NOT NULL DEFAULT 0,
    total_transfer_out_cents BIGINT NOT NULL DEFAULT 0,
    total_payment_cents BIGINT NOT NULL DEFAULT 0,
    total_redemption_cents BIGINT NOT NULL DEFAULT 0,
    
    -- Combined outgoing (for limit checks)
    total_outgoing_cents BIGINT NOT NULL DEFAULT 0,
    
    -- Transaction counts
    transaction_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(wallet_id, date)
);

CREATE INDEX idx_daily_totals_wallet_date ON daily_transaction_totals(wallet_id, date);
CREATE INDEX idx_daily_totals_date ON daily_transaction_totals(date);

-- ============================================================================
-- 6. TRUST ACCOUNT RECONCILIATION
-- ============================================================================

CREATE TYPE reconciliation_status AS ENUM ('balanced', 'deficient', 'surplus', 'under_investigation');

CREATE TABLE trust_account_reconciliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_date DATE NOT NULL UNIQUE,
    
    -- Outstanding e-money liabilities (sum of all wallet balances)
    outstanding_liabilities_cents BIGINT NOT NULL,
    
    -- Trust account balance (from bank statement)
    trust_account_balance_cents BIGINT NOT NULL,
    
    -- Calculated values
    difference_cents BIGINT NOT NULL, -- trust_balance - outstanding_liabilities
    difference_percentage NUMERIC(10, 4), -- (difference / outstanding_liabilities) * 100
    
    -- Status
    status reconciliation_status NOT NULL,
    
    -- Compliance requirement: Must be >= 100%
    is_compliant BOOLEAN NOT NULL,
    
    -- If deficient
    deficiency_resolved_at TIMESTAMP WITH TIME ZONE,
    deficiency_resolution_notes TEXT,
    
    -- Who performed reconciliation
    reconciled_by UUID, -- Admin user ID
    reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Supporting documents
    bank_statement_url TEXT,
    supporting_docs JSONB DEFAULT '[]'::jsonb,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recon_date ON trust_account_reconciliation(reconciliation_date DESC);
CREATE INDEX idx_recon_status ON trust_account_reconciliation(status);
CREATE INDEX idx_recon_compliant ON trust_account_reconciliation(is_compliant);

-- ============================================================================
-- 7. CAPITAL ADEQUACY TRACKING
-- ============================================================================

CREATE TABLE capital_adequacy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporting_month DATE NOT NULL UNIQUE, -- First day of month
    
    -- Outstanding e-money liabilities for each month
    month_1_liabilities_cents BIGINT,
    month_2_liabilities_cents BIGINT,
    month_3_liabilities_cents BIGINT,
    month_4_liabilities_cents BIGINT,
    month_5_liabilities_cents BIGINT,
    month_6_liabilities_cents BIGINT,
    
    -- Calculated average
    average_outstanding_liabilities_cents BIGINT,
    
    -- Required capital (equals average)
    required_capital_cents BIGINT,
    
    -- Actual capital held
    actual_capital_cents BIGINT,
    
    -- Compliance
    is_compliant BOOLEAN NOT NULL,
    shortfall_cents BIGINT,
    
    -- Supporting documentation
    capital_statement_url TEXT,
    supporting_docs JSONB DEFAULT '[]'::jsonb,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_capital_month ON capital_adequacy(reporting_month DESC);
CREATE INDEX idx_capital_compliant ON capital_adequacy(is_compliant);

-- ============================================================================
-- 8. DORMANT WALLETS TRACKING
-- ============================================================================

CREATE TABLE dormant_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Dormancy details
    last_transaction_date DATE NOT NULL,
    marked_dormant_at TIMESTAMP WITH TIME ZONE NOT NULL,
    balance_at_dormancy_cents BIGINT NOT NULL,
    
    -- Treatment applied (based on PSD-3 Section 11.4.5)
    treatment_applied VARCHAR(50), -- 'returned_to_bank', 'returned_to_customer', 'returned_to_sender', 'separate_account'
    treatment_date TIMESTAMP WITH TIME ZONE,
    treatment_notes TEXT,
    
    -- If moved to separate account
    separate_account_transfer_date DATE,
    eligible_for_scheme_use_date DATE, -- 3 years after separate account transfer
    
    -- Termination
    terminated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dormant_wallet ON dormant_wallets(wallet_id);
CREATE INDEX idx_dormant_user ON dormant_wallets(user_id);
CREATE INDEX idx_dormant_marked_at ON dormant_wallets(marked_dormant_at);
CREATE INDEX idx_dormant_treatment ON dormant_wallets(treatment_applied);

-- ============================================================================
-- 9. AGENTS
-- ============================================================================

CREATE TYPE agent_status AS ENUM ('active', 'suspended', 'terminated');

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Agent details
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    
    -- Location
    physical_address TEXT NOT NULL,
    gps_coordinates POINT, -- PostGIS type for location
    region VARCHAR(100),
    
    -- Agent wallet (pool account)
    wallet_id UUID REFERENCES wallets(id),
    
    -- Status
    status agent_status NOT NULL DEFAULT 'active',
    
    -- Due diligence
    due_diligence_completed BOOLEAN DEFAULT FALSE,
    due_diligence_date DATE,
    due_diligence_docs JSONB DEFAULT '[]'::jsonb,
    
    -- Contract
    contract_signed_date DATE,
    contract_expiry_date DATE,
    contract_document_url TEXT,
    
    -- Performance tracking
    total_transactions_count BIGINT DEFAULT 0,
    total_transactions_value_cents BIGINT DEFAULT 0,
    
    -- Timestamps
    onboarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agents_code ON agents(agent_code);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_region ON agents(region);

-- ============================================================================
-- 10. COMPLIANCE & REPORTING
-- ============================================================================

CREATE TYPE alert_type AS ENUM (
    'high_value_transaction',
    'velocity_check',
    'daily_limit_exceeded',
    'trust_account_deficiency',
    'dormant_wallet_pending',
    'kyc_expiry',
    'aml_flag',
    'capital_shortfall'
);

CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status AS ENUM ('open', 'investigating', 'resolved', 'false_positive');

CREATE TABLE compliance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    status alert_status NOT NULL DEFAULT 'open',
    
    -- Related entities
    user_id UUID REFERENCES users(id),
    wallet_id UUID REFERENCES wallets(id),
    transaction_id UUID REFERENCES transactions(id),
    
    -- Alert details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Investigation
    assigned_to UUID, -- Admin user ID
    assigned_at TIMESTAMP WITH TIME ZONE,
    investigated_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_alerts_type ON compliance_alerts(alert_type);
CREATE INDEX idx_alerts_severity ON compliance_alerts(severity);
CREATE INDEX idx_alerts_status ON compliance_alerts(status);
CREATE INDEX idx_alerts_created_at ON compliance_alerts(created_at DESC);
CREATE INDEX idx_alerts_user ON compliance_alerts(user_id);

-- ============================================================================
-- 11. MONTHLY REPORTS (for Bank of Namibia)
-- ============================================================================

CREATE TABLE bon_monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporting_month DATE NOT NULL UNIQUE, -- First day of month
    
    -- E-money statistics
    total_wallets INTEGER NOT NULL,
    active_wallets INTEGER NOT NULL,
    dormant_wallets INTEGER NOT NULL,
    terminated_wallets INTEGER NOT NULL,
    
    -- Transaction volumes
    total_transactions_count BIGINT NOT NULL,
    total_transactions_value_cents BIGINT NOT NULL,
    
    -- By transaction type
    load_count BIGINT NOT NULL,
    load_value_cents BIGINT NOT NULL,
    transfer_count BIGINT NOT NULL,
    transfer_value_cents BIGINT NOT NULL,
    payment_count BIGINT NOT NULL,
    payment_value_cents BIGINT NOT NULL,
    redemption_count BIGINT NOT NULL,
    redemption_value_cents BIGINT NOT NULL,
    
    -- Outstanding liabilities
    outstanding_liabilities_cents BIGINT NOT NULL,
    trust_account_balance_cents BIGINT NOT NULL,
    
    -- Interest earned
    interest_earned_cents BIGINT NOT NULL,
    interest_withdrawn_cents BIGINT NOT NULL,
    
    -- Dormant wallets details
    dormant_wallets_count INTEGER NOT NULL,
    dormant_wallets_value_cents BIGINT NOT NULL,
    terminated_dormant_wallets_count INTEGER NOT NULL,
    terminated_dormant_wallets_value_cents BIGINT NOT NULL,
    
    -- Compliance
    aml_flags_count INTEGER NOT NULL,
    str_filed_count INTEGER NOT NULL, -- Suspicious Transaction Reports
    
    -- Submitted to BoN
    submitted_to_bon BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by UUID, -- Admin user ID
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bon_reports_month ON bon_monthly_reports(reporting_month DESC);
CREATE INDEX idx_bon_reports_submitted ON bon_monthly_reports(submitted_to_bon);

-- ============================================================================
-- 12. INTEROPERABILITY
-- ============================================================================

CREATE TYPE interop_status AS ENUM ('pending', 'completed', 'failed', 'reversed');

CREATE TABLE interop_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref VARCHAR(50) UNIQUE NOT NULL,
    
    -- Sender (on our platform)
    sender_wallet_id UUID REFERENCES wallets(id),
    sender_identifier VARCHAR(100) NOT NULL, -- Phone number or wallet ID
    
    -- Recipient (on other platform)
    recipient_platform VARCHAR(100) NOT NULL, -- Name of other e-money issuer
    recipient_identifier VARCHAR(100) NOT NULL, -- Phone number or wallet ID
    
    -- Transaction details
    amount_cents BIGINT NOT NULL,
    fee_cents BIGINT NOT NULL DEFAULT 0,
    
    -- Status
    status interop_status NOT NULL DEFAULT 'pending',
    
    -- Switch/Gateway details
    switch_reference VARCHAR(100),
    switch_response JSONB,
    
    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interop_ref ON interop_transactions(transaction_ref);
CREATE INDEX idx_interop_sender ON interop_transactions(sender_wallet_id);
CREATE INDEX idx_interop_status ON interop_transactions(status);
CREATE INDEX idx_interop_initiated_at ON interop_transactions(initiated_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_kyc_verifications_updated_at BEFORE UPDATE ON kyc_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_daily_transaction_totals_updated_at BEFORE UPDATE ON daily_transaction_totals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_trust_account_reconciliation_updated_at BEFORE UPDATE ON trust_account_reconciliation FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_capital_adequacy_updated_at BEFORE UPDATE ON capital_adequacy FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_dormant_wallets_updated_at BEFORE UPDATE ON dormant_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_compliance_alerts_updated_at BEFORE UPDATE ON compliance_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bon_monthly_reports_updated_at BEFORE UPDATE ON bon_monthly_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_interop_transactions_updated_at BEFORE UPDATE ON interop_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to get KYC tier limits
CREATE OR REPLACE FUNCTION get_kyc_limits(
    p_kyc_tier kyc_tier,
    p_user_type user_type
)
RETURNS TABLE (
    daily_limit_cents BIGINT,
    monthly_balance_limit_cents BIGINT
) AS $$
BEGIN
    IF p_kyc_tier = 'lite' THEN
        -- Lite KYC: N$10,000 daily, N$10,000 monthly (both individual and business)
        RETURN QUERY SELECT 1000000::BIGINT, 1000000::BIGINT;
    ELSIF p_kyc_tier = 'full' THEN
        IF p_user_type = 'individual' THEN
            -- Full KYC Individual: N$20,000 daily, N$50,000 monthly
            RETURN QUERY SELECT 2000000::BIGINT, 5000000::BIGINT;
        ELSE
            -- Full KYC Business: N$50,000 daily, N$100,000 monthly
            RETURN QUERY SELECT 5000000::BIGINT, 10000000::BIGINT;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update wallet limits when KYC tier changes
CREATE OR REPLACE FUNCTION update_wallet_limits_on_kyc_change()
RETURNS TRIGGER AS $$
DECLARE
    v_limits RECORD;
BEGIN
    IF NEW.kyc_tier != OLD.kyc_tier OR NEW.user_type != OLD.user_type THEN
        -- Get new limits
        SELECT * INTO v_limits FROM get_kyc_limits(NEW.kyc_tier, NEW.user_type);
        
        -- Update wallet
        UPDATE wallets
        SET 
            daily_limit_cents = v_limits.daily_limit_cents,
            monthly_balance_limit_cents = v_limits.monthly_balance_limit_cents,
            updated_at = NOW()
        WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_limits_trigger
AFTER UPDATE ON users
FOR EACH ROW
WHEN (OLD.kyc_tier IS DISTINCT FROM NEW.kyc_tier OR OLD.user_type IS DISTINCT FROM NEW.user_type)
EXECUTE FUNCTION update_wallet_limits_on_kyc_change();

-- ============================================================================
-- INITIAL DATA / SEED DATA
-- ============================================================================

-- Example: System configuration table (optional)
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO system_config (key, value, description) VALUES
('initial_capital_nad', '1500000', 'Initial capital requirement in NAD (N$1.5 million)'),
('trust_account_min_percentage', '100', 'Minimum trust account balance as % of outstanding liabilities'),
('dormant_wallet_months', '6', 'Months of inactivity before wallet marked dormant'),
('dormant_warning_days', '30', 'Days before dormancy to send warning'),
('separate_account_holding_years', '3', 'Years to hold unclaimed dormant funds before use for scheme'),
('high_value_transaction_threshold_cents', '10000000', 'N$100,000 in cents - triggers compliance review');

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Outstanding e-money liabilities (real-time)
CREATE OR REPLACE VIEW v_outstanding_liabilities AS
SELECT
    SUM(balance_cents) AS total_outstanding_liabilities_cents,
    COUNT(*) AS total_wallets,
    COUNT(*) FILTER (WHERE status = 'active') AS active_wallets,
    COUNT(*) FILTER (WHERE status = 'dormant') AS dormant_wallets,
    SUM(balance_cents) FILTER (WHERE status = 'active') AS active_balance_cents,
    SUM(balance_cents) FILTER (WHERE status = 'dormant') AS dormant_balance_cents,
    NOW() AS calculated_at
FROM wallets;

-- Daily transaction summary
CREATE OR REPLACE VIEW v_daily_transaction_summary AS
SELECT
    DATE(created_at) AS transaction_date,
    type,
    COUNT(*) AS transaction_count,
    SUM(amount_cents) AS total_amount_cents,
    SUM(fee_cents) AS total_fee_cents,
    AVG(amount_cents) AS avg_amount_cents
FROM transactions
WHERE status = 'completed'
GROUP BY DATE(created_at), type
ORDER BY transaction_date DESC, type;

-- User KYC summary
CREATE OR REPLACE VIEW v_user_kyc_summary AS
SELECT
    kyc_tier,
    user_type,
    kyc_status,
    COUNT(*) AS user_count,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_users,
    SUM(CASE WHEN is_pep THEN 1 ELSE 0 END) AS pep_count
FROM users
GROUP BY kyc_tier, user_type, kyc_status
ORDER BY kyc_tier, user_type, kyc_status;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with KYC information per PSD-3 and Payment System Notice 2025';
COMMENT ON TABLE wallets IS 'E-money wallets with balances and limits';
COMMENT ON TABLE transactions IS 'All e-money transactions (load, transfer, payment, redemption)';
COMMENT ON TABLE trust_account_reconciliation IS 'Daily reconciliation of trust account vs outstanding liabilities (PSD-3 Section 11.2.4)';
COMMENT ON TABLE capital_adequacy IS 'Ongoing capital adequacy tracking (PSD-3 Section 11.5)';
COMMENT ON TABLE dormant_wallets IS 'Tracking of dormant wallets per PSD-3 Section 11.4';
COMMENT ON TABLE bon_monthly_reports IS 'Monthly reports for Bank of Namibia submission';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

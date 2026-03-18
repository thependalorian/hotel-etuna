-- Migration: 027_emoney_issuance_log.sql
-- Purpose: PSD-3 §2.6 - E-money issuance and redemption audit trail
-- Priority: CRITICAL
-- Date: 2026-03-17

-- ============================================================================
-- E-MONEY ISSUANCE LOG TABLE
-- ============================================================================
-- Comprehensive audit trail of all e-money lifecycle events (PSD-3 §2.6)
CREATE TABLE IF NOT EXISTS emoney_issuance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and wallet
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  
  -- E-money operation type
  operation_type VARCHAR(30) NOT NULL CHECK (operation_type IN (
    'issuance',           -- E-money created (cash-in, bank transfer, etc.)
    'redemption',         -- E-money destroyed (cash-out, bank transfer out)
    'transfer_in',        -- E-money received from another user
    'transfer_out',       -- E-money sent to another user
    'reversal',           -- Transaction reversal
    'adjustment',         -- Manual correction (requires approval)
    'expiry',             -- E-money expired (vouchers)
    'confiscation'        -- Regulatory seizure
  )),
  
  -- Amount and currency
  amount NUMERIC(15,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'NAD',
  
  -- Wallet balance tracking
  wallet_balance_before NUMERIC(15,2) NOT NULL,
  wallet_balance_after NUMERIC(15,2) NOT NULL,
  
  -- Source of funds (for issuance)
  source_type VARCHAR(30) CHECK (source_type IN (
    'bank_transfer',      -- EFT from bank account
    'card_payment',       -- Debit/credit card top-up
    'cash_deposit',       -- Cash at agent/ATM
    'voucher',            -- G2P voucher redemption
    'refund',             -- Merchant refund
    'p2p_transfer',       -- From another user
    'loan_disbursement',  -- Loan credit
    'grant',              -- G2P grant
    'interest',           -- Interest earned
    'bonus',              -- Promotional credit
    'other'
  )),
  source_reference VARCHAR(100),
  
  -- Destination of funds (for redemption)
  destination_type VARCHAR(30) CHECK (destination_type IN (
    'bank_transfer',      -- EFT to bank account
    'cash_withdrawal',    -- Cash at agent/ATM
    'card_payment',       -- Card transaction
    'merchant_payment',   -- Merchant purchase
    'bill_payment',       -- Utility bill
    'p2p_transfer',       -- To another user
    'loan_repayment',     -- Loan payment
    'fee',                -- Transaction fee
    'other'
  )),
  destination_reference VARCHAR(100),
  
  -- Related entities
  related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  related_voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
  related_loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  counterparty_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Trust account impact
  trust_account_id UUID REFERENCES trust_accounts(id) ON DELETE RESTRICT,
  trust_account_impacted BOOLEAN NOT NULL DEFAULT false,
  trust_account_change NUMERIC(15,2) DEFAULT 0,
  
  -- Regulatory classification
  bop_code VARCHAR(8) REFERENCES bop_codes(code),
  cross_border BOOLEAN NOT NULL DEFAULT false,
  
  -- Fraud and compliance flags
  flagged_for_review BOOLEAN NOT NULL DEFAULT false,
  review_reason TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  
  -- Approval (for adjustments and high-value transactions)
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Audit timestamps
  operation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_emoney_log_user_date ON emoney_issuance_log(user_id, operation_timestamp DESC);
CREATE INDEX idx_emoney_log_wallet_date ON emoney_issuance_log(wallet_id, operation_timestamp DESC);
CREATE INDEX idx_emoney_log_operation ON emoney_issuance_log(operation_type, operation_timestamp DESC);
CREATE INDEX idx_emoney_log_date ON emoney_issuance_log(operation_timestamp DESC);
CREATE INDEX idx_emoney_log_amount ON emoney_issuance_log(amount DESC) WHERE operation_type IN ('issuance', 'redemption');
CREATE INDEX idx_emoney_log_flagged ON emoney_issuance_log(flagged_for_review, operation_timestamp DESC) 
  WHERE flagged_for_review = true;
CREATE INDEX idx_emoney_log_trust_account ON emoney_issuance_log(trust_account_id, operation_timestamp DESC) 
  WHERE trust_account_impacted = true;
CREATE INDEX idx_emoney_log_related_tx ON emoney_issuance_log(related_transaction_id) 
  WHERE related_transaction_id IS NOT NULL;

-- ============================================================================
-- E-MONEY FLOAT SUMMARY VIEW
-- ============================================================================
-- Real-time summary of e-money float by currency
CREATE OR REPLACE VIEW vw_emoney_float_summary AS
SELECT
  currency,
  COUNT(DISTINCT user_id) AS total_users,
  COUNT(DISTINCT wallet_id) AS total_wallets,
  SUM(CASE WHEN operation_type = 'issuance' THEN amount ELSE 0 END) AS total_issued,
  SUM(CASE WHEN operation_type = 'redemption' THEN amount ELSE 0 END) AS total_redeemed,
  SUM(CASE WHEN operation_type = 'issuance' THEN amount ELSE -amount END) AS net_emoney_float,
  MAX(operation_timestamp) AS last_operation_at
FROM emoney_issuance_log
WHERE operation_type IN ('issuance', 'redemption')
GROUP BY currency;

-- ============================================================================
-- DAILY E-MONEY ISSUANCE SUMMARY VIEW
-- ============================================================================
-- Daily aggregation for BoN reporting
CREATE OR REPLACE VIEW vw_daily_emoney_summary AS
SELECT
  DATE(operation_timestamp) AS operation_date,
  currency,
  operation_type,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_amount,
  AVG(amount) AS avg_amount,
  MIN(amount) AS min_amount,
  MAX(amount) AS max_amount,
  COUNT(DISTINCT user_id) AS unique_users
FROM emoney_issuance_log
WHERE operation_type IN ('issuance', 'redemption')
GROUP BY DATE(operation_timestamp), currency, operation_type
ORDER BY operation_date DESC, currency, operation_type;

-- ============================================================================
-- HIGH-VALUE TRANSACTION VIEW
-- ============================================================================
-- Transactions exceeding NAD 25,000 (requires enhanced monitoring per PSD-3)
CREATE OR REPLACE VIEW vw_high_value_emoney_operations AS
SELECT
  id,
  user_id,
  wallet_id,
  operation_type,
  amount,
  currency,
  source_type,
  destination_type,
  cross_border,
  flagged_for_review,
  reviewed_at,
  operation_timestamp
FROM emoney_issuance_log
WHERE amount >= 25000
  AND currency = 'NAD'
  AND operation_type IN ('issuance', 'redemption')
ORDER BY operation_timestamp DESC;

-- ============================================================================
-- HELPER FUNCTION: Log E-Money Operation
-- ============================================================================

CREATE OR REPLACE FUNCTION log_emoney_operation(
  p_user_id UUID,
  p_wallet_id UUID,
  p_operation_type VARCHAR,
  p_amount NUMERIC,
  p_currency CHAR(3),
  p_wallet_balance_before NUMERIC,
  p_wallet_balance_after NUMERIC,
  p_source_type VARCHAR DEFAULT NULL,
  p_destination_type VARCHAR DEFAULT NULL,
  p_related_transaction_id UUID DEFAULT NULL,
  p_trust_account_id UUID DEFAULT NULL,
  p_trust_account_change NUMERIC DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_requires_approval BOOLEAN DEFAULT false;
  v_flagged BOOLEAN DEFAULT false;
BEGIN
  -- Flag high-value transactions
  IF p_amount >= 25000 AND p_currency = 'NAD' THEN
    v_flagged := true;
  END IF;
  
  -- Require approval for adjustments
  IF p_operation_type = 'adjustment' THEN
    v_requires_approval := true;
  END IF;
  
  -- Insert log entry
  INSERT INTO emoney_issuance_log (
    user_id,
    wallet_id,
    operation_type,
    amount,
    currency,
    wallet_balance_before,
    wallet_balance_after,
    source_type,
    destination_type,
    related_transaction_id,
    trust_account_id,
    trust_account_impacted,
    trust_account_change,
    flagged_for_review,
    requires_approval,
    metadata
  ) VALUES (
    p_user_id,
    p_wallet_id,
    p_operation_type,
    p_amount,
    p_currency,
    p_wallet_balance_before,
    p_wallet_balance_after,
    p_source_type,
    p_destination_type,
    p_related_transaction_id,
    p_trust_account_id,
    (p_trust_account_id IS NOT NULL),
    p_trust_account_change,
    v_flagged,
    v_requires_approval,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE emoney_issuance_log IS 'PSD-3 §2.6: Complete audit trail of e-money lifecycle (issuance, redemption, transfer)';
COMMENT ON VIEW vw_emoney_float_summary IS 'Real-time summary of e-money float by currency for reconciliation';
COMMENT ON VIEW vw_daily_emoney_summary IS 'Daily aggregation of e-money operations for BoN reporting';
COMMENT ON VIEW vw_high_value_emoney_operations IS 'Transactions ≥NAD 25,000 requiring enhanced monitoring';

COMMENT ON COLUMN emoney_issuance_log.trust_account_impacted IS 'Indicates if this operation required trust account deposit/withdrawal';
COMMENT ON COLUMN emoney_issuance_log.flagged_for_review IS 'Auto-flagged for compliance review (high-value, suspicious pattern, etc.)';

-- Migration complete

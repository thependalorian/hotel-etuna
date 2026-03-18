-- Migration: 026_trust_account_reconciliation.sql
-- Purpose: PSD-3 §2.5 - Trust account backing and daily reconciliation
-- Priority: CRITICAL
-- Date: 2026-03-17

-- ============================================================================
-- TRUST ACCOUNTS TABLE
-- ============================================================================
-- Stores trust account information where e-money float is backed
CREATE TABLE IF NOT EXISTS trust_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number VARCHAR(34) NOT NULL UNIQUE,
  account_name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  bank_swift_code VARCHAR(11),
  currency CHAR(3) NOT NULL DEFAULT 'NAD',
  account_type VARCHAR(20) NOT NULL DEFAULT 'trust' CHECK (account_type IN ('trust', 'reserve', 'operational')),
  
  -- Balance tracking
  current_balance NUMERIC(20,2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  opened_at DATE NOT NULL,
  closed_at DATE,
  
  -- BoN compliance
  bon_approval_reference VARCHAR(50),
  bon_approved_at DATE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trust_accounts_status ON trust_accounts(status) WHERE status = 'active';
CREATE INDEX idx_trust_accounts_currency ON trust_accounts(currency, status);

-- ============================================================================
-- TRUST ACCOUNT RECONCILIATIONS TABLE
-- ============================================================================
-- Daily reconciliation of e-money float vs trust account balances (PSD-3 §2.5)
CREATE TABLE IF NOT EXISTS trust_account_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_account_id UUID NOT NULL REFERENCES trust_accounts(id) ON DELETE RESTRICT,
  
  -- Reconciliation date
  reconciliation_date DATE NOT NULL,
  
  -- E-money float (sum of all user wallet balances)
  total_emoney_float NUMERIC(20,2) NOT NULL CHECK (total_emoney_float >= 0),
  total_wallet_count BIGINT NOT NULL DEFAULT 0,
  
  -- Trust account balance (from bank statement)
  trust_account_balance NUMERIC(20,2) NOT NULL,
  bank_statement_reference VARCHAR(100),
  
  -- Reconciliation result
  variance NUMERIC(20,2) NOT NULL GENERATED ALWAYS AS (trust_account_balance - total_emoney_float) STORED,
  variance_percentage NUMERIC(7,4),
  status VARCHAR(20) NOT NULL DEFAULT 'balanced' CHECK (status IN (
    'balanced',           -- Variance within tolerance (±0.01%)
    'minor_variance',     -- Variance 0.01-0.1%
    'major_variance',     -- Variance >0.1%
    'under_backed',       -- Trust account < e-money float (CRITICAL)
    'pending_review',     -- Awaiting investigation
    'resolved'            -- Variance explained and resolved
  )),
  
  -- Investigation
  variance_reason TEXT,
  investigated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  investigated_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- BoN reporting
  reported_to_bon BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMPTZ,
  bon_reference VARCHAR(50),
  
  -- Audit trail
  reconciled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reconciled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one reconciliation per account per day
  UNIQUE(trust_account_id, reconciliation_date)
);

CREATE INDEX idx_trust_recon_account_date ON trust_account_reconciliations(trust_account_id, reconciliation_date DESC);
CREATE INDEX idx_trust_recon_status ON trust_account_reconciliations(status, reconciliation_date DESC);
CREATE INDEX idx_trust_recon_date ON trust_account_reconciliations(reconciliation_date DESC);
CREATE INDEX idx_trust_recon_critical ON trust_account_reconciliations(status, variance) 
  WHERE status IN ('under_backed', 'major_variance');

-- ============================================================================
-- TRUST ACCOUNT TRANSACTIONS TABLE
-- ============================================================================
-- Tracks deposits to and withdrawals from trust accounts
CREATE TABLE IF NOT EXISTS trust_account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_account_id UUID NOT NULL REFERENCES trust_accounts(id) ON DELETE RESTRICT,
  
  -- Transaction details
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
    'deposit',            -- Cash-in to trust account
    'withdrawal',         -- Cash-out from trust account
    'interest_earned',    -- Interest from bank
    'bank_fee',           -- Bank charges
    'adjustment'          -- Manual correction
  )),
  amount NUMERIC(20,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'NAD',
  
  -- Balance tracking
  balance_before NUMERIC(20,2) NOT NULL,
  balance_after NUMERIC(20,2) NOT NULL,
  
  -- Bank details
  bank_reference VARCHAR(100),
  bank_transaction_date DATE NOT NULL,
  bank_value_date DATE,
  
  -- Link to e-money operations
  related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Description and notes
  description TEXT NOT NULL,
  notes TEXT,
  
  -- Audit trail
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trust_tx_account_date ON trust_account_transactions(trust_account_id, bank_transaction_date DESC);
CREATE INDEX idx_trust_tx_type ON trust_account_transactions(transaction_type, bank_transaction_date DESC);
CREATE INDEX idx_trust_tx_related_tx ON trust_account_transactions(related_transaction_id) 
  WHERE related_transaction_id IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_trust_accounts_updated_at
  BEFORE UPDATE ON trust_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trust_recon_updated_at
  BEFORE UPDATE ON trust_account_reconciliations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTION: Calculate E-Money Float
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_emoney_float(p_currency CHAR(3) DEFAULT 'NAD')
RETURNS NUMERIC(20,2) AS $$
DECLARE
  v_total NUMERIC(20,2);
BEGIN
  SELECT COALESCE(SUM(balance), 0)
  INTO v_total
  FROM wallets
  WHERE currency = p_currency
    AND status = 'active';
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- INITIAL DATA: Create default trust account
-- ============================================================================

INSERT INTO trust_accounts (
  account_number,
  account_name,
  bank_name,
  bank_swift_code,
  currency,
  account_type,
  current_balance,
  status,
  opened_at,
  notes
) VALUES (
  'NA1200000000000000000001',
  'Smartpay E-Money Trust Account',
  'First National Bank Namibia',
  'FIRNNANX',
  'NAD',
  'trust',
  0.00,
  'active',
  CURRENT_DATE,
  'Primary trust account for NAD e-money backing. Requires BoN approval before going live.'
) ON CONFLICT (account_number) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE trust_accounts IS 'PSD-3 §2.5: Trust accounts where e-money float is backed';
COMMENT ON TABLE trust_account_reconciliations IS 'PSD-3 §2.5: Daily reconciliation of e-money float vs trust account balances';
COMMENT ON TABLE trust_account_transactions IS 'Audit trail of all trust account banking transactions';

COMMENT ON COLUMN trust_account_reconciliations.variance IS 'Difference between trust account balance and e-money float (positive = over-backed, negative = under-backed)';
COMMENT ON COLUMN trust_account_reconciliations.status IS 'under_backed status triggers immediate BoN notification';

-- Migration complete

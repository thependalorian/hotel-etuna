-- Initial Schema for SmartPay Backend
-- Following Buffr G2P database patterns
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                   VARCHAR(20) NOT NULL UNIQUE,
  email                   VARCHAR(255),
  first_name              VARCHAR(100),
  last_name               VARCHAR(100),
  full_name               VARCHAR(200),
  photo_url               TEXT,
  pin_hash                VARCHAR(255),
  pin_salt                VARCHAR(255),
  
  -- Proof of life (biometric verification)
  last_proof_of_life      TIMESTAMPTZ,
  proof_of_life_due_date  TIMESTAMPTZ,
  
  -- Status
  wallet_status           VARCHAR(20) DEFAULT 'active',
  
  -- External integrations
  fineract_client_id      INTEGER,
  
  -- Metadata
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_proof_of_life_due 
  ON users(proof_of_life_due_date) 
  WHERE wallet_status = 'active';

-- ============================================================================
-- WALLETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallets (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                        VARCHAR(100) NOT NULL,
  type                        VARCHAR(20) NOT NULL DEFAULT 'main',
  balance                     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency                    CHAR(3) NOT NULL DEFAULT 'NAD',
  is_primary                  BOOLEAN DEFAULT false,
  
  -- External sync
  fineract_savings_account_id INTEGER,
  
  -- Metadata
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_type ON wallets(type);
CREATE INDEX idx_wallets_fineract 
  ON wallets(fineract_savings_account_id) 
  WHERE fineract_savings_account_id IS NOT NULL;

-- ============================================================================
-- WALLET TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id         UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type              VARCHAR(50) NOT NULL,
  amount            NUMERIC(14,2) NOT NULL,
  balance_after     NUMERIC(14,2),
  reference_type    VARCHAR(50),
  reference_id      UUID,
  reference         TEXT,
  description       TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_wallet_created 
  ON wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX idx_wallet_tx_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_tx_reference 
  ON wallet_transactions(reference_id) 
  WHERE reference_id IS NOT NULL;

-- ============================================================================
-- VOUCHERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount            NUMERIC(14,2) NOT NULL,
  currency          CHAR(3) NOT NULL DEFAULT 'NAD',
  status            VARCHAR(20) NOT NULL DEFAULT 'available',
  type              VARCHAR(50),
  programme         VARCHAR(100),
  expires_at        TIMESTAMPTZ NOT NULL,
  external_id       VARCHAR(100),
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vouchers_user_status ON vouchers(user_id, status);
CREATE INDEX idx_vouchers_expires_at 
  ON vouchers(expires_at) 
  WHERE status = 'available';
CREATE INDEX idx_vouchers_external_id 
  ON vouchers(external_id) 
  WHERE external_id IS NOT NULL;

-- ============================================================================
-- VOUCHER REDEMPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id        UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method            VARCHAR(50) NOT NULL,
  amount_credited   NUMERIC(14,2) NOT NULL,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voucher_redemptions_voucher ON voucher_redemptions(voucher_id);
CREATE INDEX idx_voucher_redemptions_user ON voucher_redemptions(user_id);

-- ============================================================================
-- LOANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS loans (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id                       UUID REFERENCES wallets(id) ON DELETE SET NULL,
  amount                          NUMERIC(14,2) NOT NULL,
  interest_rate                   NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  total_repayment                 NUMERIC(14,2) NOT NULL,
  status                          VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- Voucher-backed loan eligibility
  previous_voucher_value          NUMERIC(14,2),
  
  -- Lifecycle
  disbursed_at                    TIMESTAMPTZ,
  repaid_at                       TIMESTAMPTZ,
  repayment_voucher_redemption_id UUID,
  
  -- External sync
  fineract_loan_id                INTEGER,
  
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loans_user_status ON loans(user_id, status);
CREATE INDEX idx_loans_wallet ON loans(wallet_id);

-- ============================================================================
-- P2P TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS p2p_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id         UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount            NUMERIC(14,2) NOT NULL,
  note              TEXT,
  status            VARCHAR(20) NOT NULL DEFAULT 'completed',
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_p2p_sender ON p2p_transactions(sender_id, created_at DESC);
CREATE INDEX idx_p2p_recipient ON p2p_transactions(recipient_id, created_at DESC);
CREATE INDEX idx_p2p_wallet ON p2p_transactions(wallet_id);

-- ============================================================================
-- CASH OUT CODES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cash_out_codes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code              VARCHAR(10) NOT NULL,
  amount            NUMERIC(14,2) NOT NULL,
  method            VARCHAR(50) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'active',
  expires_at        TIMESTAMPTZ NOT NULL,
  redeemed_at       TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cash_out_codes_user ON cash_out_codes(user_id);
CREATE INDEX idx_cash_out_codes_code ON cash_out_codes(code) WHERE status = 'active';
CREATE INDEX idx_cash_out_codes_expires ON cash_out_codes(expires_at) WHERE status = 'active';

-- ============================================================================
-- GROUP WALLETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_wallets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id          VARCHAR(100) NOT NULL,
  name              VARCHAR(100) NOT NULL,
  balance           NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency          CHAR(3) NOT NULL DEFAULT 'NAD',
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_wallets_group ON group_wallets(group_id);

-- ============================================================================
-- GROUP CONTRIBUTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_contributions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id          VARCHAR(100) NOT NULL,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id         UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount            NUMERIC(14,2) NOT NULL,
  note              TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_contributions_group ON group_contributions(group_id, created_at DESC);
CREATE INDEX idx_group_contributions_user ON group_contributions(user_id);

-- ============================================================================
-- OTP CODES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone             VARCHAR(20) NOT NULL,
  code              VARCHAR(6) NOT NULL,
  purpose           VARCHAR(50) NOT NULL DEFAULT 'login',
  attempts          INTEGER NOT NULL DEFAULT 0,
  max_attempts      INTEGER NOT NULL DEFAULT 3,
  expires_at        TIMESTAMPTZ NOT NULL,
  verified_at       TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_phone_purpose_expires 
  ON otp_codes(phone, purpose, expires_at);

-- ============================================================================
-- USER SESSIONS TABLE (JWT Access Tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token             TEXT NOT NULL UNIQUE,
  expires_at        TIMESTAMPTZ NOT NULL,
  last_active_at    TIMESTAMPTZ DEFAULT NOW(),
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- ============================================================================
-- REFRESH TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token             TEXT NOT NULL UNIQUE,
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked           BOOLEAN DEFAULT false,
  revoked_at        TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked) WHERE revoked = false;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_wallets_updated_at
  BEFORE UPDATE ON group_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ANALYTICS AND AUDIT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type        VARCHAR(100) NOT NULL,
  event_data        JSONB,
  device_info       JSONB,
  ip_address        INET,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_type ON analytics_events(event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  action            VARCHAR(100) NOT NULL,
  resource_type     VARCHAR(50),
  resource_id       UUID,
  changes           JSONB,
  ip_address        INET,
  user_agent        TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Migration complete

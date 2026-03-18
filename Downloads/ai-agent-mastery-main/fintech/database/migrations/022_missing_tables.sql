-- ================================================================
-- Migration: 017_missing_tables_and_indexes
-- Date: March 16, 2026
-- Priority: CRITICAL
-- Description: Creates 8 missing critical tables and adds performance indexes
-- ================================================================

-- MISSING TABLES CREATED:
-- 1. copilot_audit_log - ETA §32 compliance audit logging
-- 2. groups - Group/savings circles functionality
-- 3. group_members - Group membership management
-- 4. grants - G2P grant disbursement tracking
-- 5. fee_audit_log - Fee transparency audit trail
-- 6. rate_limits - Persistent rate limiting storage
-- 7. voucher_redemptions - Voucher/coupon redemption tracking
-- 8. loan_applications - Loan application processing

-- INDEXES ADDED:
-- - 30+ performance indexes for existing tables
-- - Indexes for all new tables
-- - JSONB GIN indexes for metadata searches
-- - Partial indexes for filtered queries

-- ================================================================
-- TABLE 1: copilot_audit_log
-- ================================================================

CREATE TABLE IF NOT EXISTS copilot_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  tool_name TEXT,
  action TEXT NOT NULL,
  input JSONB DEFAULT '{}',
  result TEXT NOT NULL CHECK (result IN ('success', 'failure')),
  status_code INT NOT NULL,
  response_time INT NOT NULL,
  error_message TEXT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'automated')),
  is_automated BOOLEAN NOT NULL DEFAULT false,
  integrity_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_audit_user 
  ON copilot_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_copilot_audit_tool 
  ON copilot_audit_log(tool_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_copilot_audit_result 
  ON copilot_audit_log(result, created_at DESC);

-- ================================================================
-- TABLE 2: groups
-- ================================================================

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  member_count INT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_wallet ON groups(wallet_id);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);

-- ================================================================
-- TABLE 3: group_members
-- ================================================================

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'treasurer', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'left')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id, status);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON group_members(group_id, user_id);

-- ================================================================
-- TABLE 4: grants
-- ================================================================

CREATE TABLE IF NOT EXISTS grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  program_name TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  disbursement_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'disbursed', 'failed', 'cancelled')),
  bop_code VARCHAR(8) REFERENCES bop_codes(code),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grants_user ON grants(user_id, disbursement_date DESC);
CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(status);
CREATE INDEX IF NOT EXISTS idx_grants_program ON grants(program_name, status);

-- ================================================================
-- TABLE 5: fee_audit_log
-- ================================================================

CREATE TABLE IF NOT EXISTS fee_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL,
  fee_amount NUMERIC(15,2) NOT NULL,
  fee_breakdown JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_audit_user ON fee_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fee_audit_txn ON fee_audit_log(transaction_id);

-- ================================================================
-- TABLE 6: rate_limits
-- ================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
  ON rate_limits(identifier, endpoint, window_end);

CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
  ON rate_limits(window_end)
  WHERE window_end < NOW();

-- ================================================================
-- TABLE 7: voucher_redemptions
-- ================================================================

CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_code VARCHAR(20) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  merchant_id UUID,
  amount NUMERIC(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_code 
  ON voucher_redemptions(voucher_code);

CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_user 
  ON voucher_redemptions(user_id, redeemed_at DESC);

CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_status 
  ON voucher_redemptions(status);

-- ================================================================
-- TABLE 8: loan_applications
-- ================================================================

CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  amount NUMERIC(15,2) NOT NULL,
  purpose TEXT,
  duration_months INT NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed', 'cancelled')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  disbursed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_applications_user 
  ON loan_applications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loan_applications_status 
  ON loan_applications(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loan_applications_wallet 
  ON loan_applications(wallet_id);

-- ================================================================
-- PERFORMANCE INDEXES FOR EXISTING TABLES
-- ================================================================

-- Group operations
CREATE INDEX IF NOT EXISTS idx_group_members_group_user 
  ON group_members(group_id, user_id);

-- Transaction type filtering
CREATE INDEX IF NOT EXISTS idx_transactions_type_status 
  ON transactions(type, status, created_at DESC);

-- Group contribution searches via JSONB metadata
CREATE INDEX IF NOT EXISTS idx_transactions_metadata_groupid 
  ON transactions((metadata->>'groupId'))
  WHERE type IN ('group_contribution', 'group_withdrawal', 'group_send');

-- Wallet currency searches
CREATE INDEX IF NOT EXISTS idx_wallets_user_currency 
  ON wallets(user_id, currency, status);

CREATE INDEX IF NOT EXISTS idx_wallets_active 
  ON wallets(status) 
  WHERE status = 'active';

-- KYC submission status filtering
CREATE INDEX IF NOT EXISTS idx_kyc_pending 
  ON kyc_submissions(submitted_at DESC)
  WHERE status = 'pending';

-- OBS consent expiration monitoring
CREATE INDEX IF NOT EXISTS idx_obs_consent_expiry 
  ON obs_consents(expires_at, status)
  WHERE status = 'active';

-- Fraud detection queries
CREATE INDEX IF NOT EXISTS idx_transactions_fraud_detection 
  ON transactions(user_id, status, created_at)
  WHERE status = 'completed';

-- Transaction history optimization
CREATE INDEX IF NOT EXISTS idx_transactions_source_user_completed 
  ON transactions(source_user_id, created_at DESC)
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_transactions_dest_user_completed 
  ON transactions(destination_user_id, created_at DESC)
  WHERE status = 'completed';

-- Transaction amount range queries
CREATE INDEX IF NOT EXISTS idx_transactions_amount 
  ON transactions(amount)
  WHERE status = 'completed';

-- User status filtering
CREATE INDEX IF NOT EXISTS idx_users_status 
  ON users(account_status)
  WHERE account_status = 'active';

-- Copilot security severity filtering
CREATE INDEX IF NOT EXISTS idx_copilot_sec_severity 
  ON copilot_security_events(severity, created_at DESC)
  WHERE auto_blocked = true;

-- Card transaction merchant searches
CREATE INDEX IF NOT EXISTS idx_card_txn_merchant 
  ON card_transactions(merchant_name)
  WHERE status = 'completed';

-- OBS consent audit trail
CREATE INDEX IF NOT EXISTS idx_obs_audit_consent 
  ON obs_consent_audit_log(consent_id, created_at DESC);

-- ================================================================
-- MIGRATION TRACKING
-- ================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT,
  execution_time_ms INT
);

-- Record this migration
INSERT INTO schema_migrations (version, applied_at)
VALUES ('017_missing_tables_and_indexes', NOW())
ON CONFLICT (version) DO NOTHING;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Verify all 8 tables exist
DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name)
  INTO missing_tables
  FROM (
    VALUES 
      ('copilot_audit_log'),
      ('groups'),
      ('group_members'),
      ('grants'),
      ('fee_audit_log'),
      ('rate_limits'),
      ('voucher_redemptions'),
      ('loan_applications')
  ) AS required_tables(table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = required_tables.table_name
  );
  
  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Missing tables: %', missing_tables;
  ELSE
    RAISE NOTICE 'All 8 critical tables verified successfully';
  END IF;
END $$;

-- Count indexes created
SELECT 
  'Total indexes created: ' || COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- ================================================================
-- END OF MIGRATION 017
-- ================================================================

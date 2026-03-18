-- Migration: 039_free_withdrawal_tracking.sql
-- Purpose: PSD-11 §3.4 - First free ATM withdrawal per month tracking
-- Priority: MEDIUM
-- Date: 2026-03-17

-- ============================================================================
-- FREE WITHDRAWAL TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS free_withdrawal_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Time period
  year_month CHAR(7) NOT NULL,  -- Format: YYYY-MM
  
  -- Withdrawal counters (PSD-11 §3.4: first withdrawal per month is free)
  total_withdrawals INTEGER NOT NULL DEFAULT 0,
  free_withdrawals_used INTEGER NOT NULL DEFAULT 0 CHECK (free_withdrawals_used <= 1),
  paid_withdrawals INTEGER NOT NULL DEFAULT 0,
  
  -- Amount tracking
  total_withdrawal_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_fees_charged NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_fees_waived NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- First withdrawal details
  first_withdrawal_at TIMESTAMPTZ,
  first_withdrawal_amount NUMERIC(15,2),
  first_withdrawal_location VARCHAR(100),
  first_withdrawal_was_free BOOLEAN,
  
  -- ATM network
  own_bank_atm_count INTEGER NOT NULL DEFAULT 0,
  other_bank_atm_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one record per user per month
  UNIQUE(user_id, year_month)
);

CREATE INDEX idx_free_withdrawal_user_month ON free_withdrawal_tracking(user_id, year_month DESC);
CREATE INDEX idx_free_withdrawal_month ON free_withdrawal_tracking(year_month DESC);
CREATE INDEX idx_free_withdrawal_eligible ON free_withdrawal_tracking(user_id, free_withdrawals_used) 
  WHERE free_withdrawals_used = 0 AND year_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM');

-- ============================================================================
-- WITHDRAWAL FEE DETERMINATION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION determine_withdrawal_fee(
  p_user_id UUID,
  p_amount NUMERIC,
  p_is_own_bank_atm BOOLEAN DEFAULT false
) RETURNS TABLE(
  fee_amount NUMERIC(15,2),
  is_free BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_current_month CHAR(7);
  v_tracking RECORD;
  v_fee NUMERIC(15,2);
  v_is_free BOOLEAN;
  v_reason TEXT;
BEGIN
  v_current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  -- Get or create tracking record for current month
  SELECT * INTO v_tracking
  FROM free_withdrawal_tracking
  WHERE user_id = p_user_id
    AND year_month = v_current_month;
  
  -- Own bank ATMs are always free (PSD-11 §3.3)
  IF p_is_own_bank_atm THEN
    v_fee := 0;
    v_is_free := true;
    v_reason := 'Own bank ATM - always free (PSD-11 §3.3)';
  -- First withdrawal per month is free (PSD-11 §3.4)
  ELSIF v_tracking IS NULL OR v_tracking.free_withdrawals_used = 0 THEN
    v_fee := 0;
    v_is_free := true;
    v_reason := 'First withdrawal this month - free (PSD-11 §3.4)';
  -- Subsequent withdrawals incur standard fee
  ELSE
    v_fee := 5.00;  -- Standard ATM fee (configurable in transaction_fee_schedule)
    v_is_free := false;
    v_reason := 'Standard ATM fee applies (first free withdrawal already used)';
  END IF;
  
  RETURN QUERY SELECT v_fee, v_is_free, v_reason;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE TRACKING FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_withdrawal_tracking(
  p_user_id UUID,
  p_withdrawal_amount NUMERIC,
  p_fee_charged NUMERIC,
  p_is_own_bank_atm BOOLEAN,
  p_location VARCHAR
) RETURNS VOID AS $$
DECLARE
  v_current_month CHAR(7);
  v_is_free BOOLEAN;
  v_fee_waived NUMERIC(15,2);
BEGIN
  v_current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  v_is_free := (p_fee_charged = 0 AND NOT p_is_own_bank_atm);
  v_fee_waived := CASE WHEN v_is_free THEN 5.00 ELSE 0 END;
  
  -- Insert or update tracking record
  INSERT INTO free_withdrawal_tracking (
    user_id,
    year_month,
    total_withdrawals,
    free_withdrawals_used,
    paid_withdrawals,
    total_withdrawal_amount,
    total_fees_charged,
    total_fees_waived,
    first_withdrawal_at,
    first_withdrawal_amount,
    first_withdrawal_location,
    first_withdrawal_was_free,
    own_bank_atm_count,
    other_bank_atm_count
  ) VALUES (
    p_user_id,
    v_current_month,
    1,
    CASE WHEN v_is_free THEN 1 ELSE 0 END,
    CASE WHEN NOT v_is_free THEN 1 ELSE 0 END,
    p_withdrawal_amount,
    p_fee_charged,
    v_fee_waived,
    NOW(),
    p_withdrawal_amount,
    p_location,
    v_is_free,
    CASE WHEN p_is_own_bank_atm THEN 1 ELSE 0 END,
    CASE WHEN NOT p_is_own_bank_atm THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, year_month) DO UPDATE SET
    total_withdrawals = free_withdrawal_tracking.total_withdrawals + 1,
    free_withdrawals_used = CASE 
      WHEN v_is_free THEN free_withdrawal_tracking.free_withdrawals_used + 1
      ELSE free_withdrawal_tracking.free_withdrawals_used
    END,
    paid_withdrawals = CASE 
      WHEN NOT v_is_free THEN free_withdrawal_tracking.paid_withdrawals + 1
      ELSE free_withdrawal_tracking.paid_withdrawals
    END,
    total_withdrawal_amount = free_withdrawal_tracking.total_withdrawal_amount + p_withdrawal_amount,
    total_fees_charged = free_withdrawal_tracking.total_fees_charged + p_fee_charged,
    total_fees_waived = free_withdrawal_tracking.total_fees_waived + v_fee_waived,
    own_bank_atm_count = CASE 
      WHEN p_is_own_bank_atm THEN free_withdrawal_tracking.own_bank_atm_count + 1
      ELSE free_withdrawal_tracking.own_bank_atm_count
    END,
    other_bank_atm_count = CASE 
      WHEN NOT p_is_own_bank_atm THEN free_withdrawal_tracking.other_bank_atm_count + 1
      ELSE free_withdrawal_tracking.other_bank_atm_count
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MONTHLY FREE WITHDRAWAL SUMMARY VIEW
-- ============================================================================
CREATE OR REPLACE VIEW vw_monthly_free_withdrawal_summary AS
SELECT
  year_month,
  COUNT(DISTINCT user_id) AS total_users,
  SUM(total_withdrawals) AS total_withdrawals,
  SUM(free_withdrawals_used) AS total_free_withdrawals_used,
  SUM(paid_withdrawals) AS total_paid_withdrawals,
  SUM(total_withdrawal_amount) AS total_withdrawal_amount,
  SUM(total_fees_charged) AS total_fees_charged,
  SUM(total_fees_waived) AS total_fees_waived,
  COUNT(CASE WHEN free_withdrawals_used = 0 THEN 1 END) AS users_not_using_free_withdrawal,
  (SUM(free_withdrawals_used)::NUMERIC / COUNT(DISTINCT user_id)::NUMERIC * 100) AS free_withdrawal_utilization_pct
FROM free_withdrawal_tracking
WHERE year_month >= TO_CHAR(CURRENT_DATE - INTERVAL '12 months', 'YYYY-MM')
GROUP BY year_month
ORDER BY year_month DESC;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_free_withdrawal_tracking_updated_at
  BEFORE UPDATE ON free_withdrawal_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE free_withdrawal_tracking IS 'PSD-11 §3.4: Tracking first free ATM withdrawal per user per month';
COMMENT ON FUNCTION determine_withdrawal_fee IS 'Calculate withdrawal fee (first per month is free per PSD-11 §3.4)';
COMMENT ON FUNCTION update_withdrawal_tracking IS 'Update withdrawal tracking after ATM transaction';
COMMENT ON VIEW vw_monthly_free_withdrawal_summary IS 'Monthly summary of free withdrawal program utilization';

-- Migration complete

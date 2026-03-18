-- PSD-11: ATM surcharge log
CREATE TABLE IF NOT EXISTS atm_surcharge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_id UUID NOT NULL,
  atm_owner_bin VARCHAR(6),
  surcharge_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  surcharge_currency CHAR(3) NOT NULL DEFAULT 'NAD',
  is_own_bank_atm BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW vw_atm_surcharge_monthly AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  SUM(surcharge_amount) AS total_surcharges,
  COUNT(*) AS total_atm_transactions,
  COUNT(*) FILTER (WHERE is_own_bank_atm) AS own_bank_transactions,
  COUNT(*) FILTER (WHERE NOT is_own_bank_atm) AS interbank_transactions
FROM atm_surcharge_log
GROUP BY DATE_TRUNC('month', created_at);

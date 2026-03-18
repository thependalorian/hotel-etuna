-- PSD-3: E-money transaction & balance limits (BoN)
CREATE TABLE IF NOT EXISTS emoney_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'standard', 'premium')),
  max_wallet_balance NUMERIC(15,2) NOT NULL,
  max_single_transaction NUMERIC(15,2) NOT NULL,
  max_daily_transaction NUMERIC(15,2) NOT NULL,
  max_monthly_transaction NUMERIC(15,2) NOT NULL,
  kyc_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_emoney_limits_tier ON emoney_limits(tier);

INSERT INTO emoney_limits (tier, max_wallet_balance, max_single_transaction, max_daily_transaction, max_monthly_transaction, kyc_required)
VALUES
  ('basic',    5000.00,  500.00,  1000.00,  5000.00,  false),
  ('standard', 25000.00, 5000.00, 10000.00, 25000.00, true),
  ('premium',  50000.00, 25000.00, 50000.00, 100000.00, true)
ON CONFLICT (tier) DO NOTHING;

CREATE TABLE IF NOT EXISTS emoney_daily_totals (
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_sent NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_received NUMERIC(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS emoney_monthly_totals (
  user_id UUID NOT NULL,
  year_month CHAR(7) NOT NULL,
  total_sent NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_received NUMERIC(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, year_month)
);

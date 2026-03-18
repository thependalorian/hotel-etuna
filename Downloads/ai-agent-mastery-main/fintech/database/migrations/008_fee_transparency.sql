-- PSD-10: Fee transparency & cap
CREATE TABLE IF NOT EXISTS transaction_fee_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_stream TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  tier_min NUMERIC(15,2) NOT NULL DEFAULT 0,
  tier_max NUMERIC(15,2),
  fee_flat NUMERIC(15,2) NOT NULL DEFAULT 0,
  fee_percentage NUMERIC(5,4) NOT NULL DEFAULT 0,
  fee_cap NUMERIC(15,2),
  vat_inclusive BOOLEAN NOT NULL DEFAULT false,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

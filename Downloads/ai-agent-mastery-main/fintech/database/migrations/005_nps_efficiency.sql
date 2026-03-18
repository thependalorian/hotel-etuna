-- PSD-7: NPS efficiency metrics
CREATE TABLE IF NOT EXISTS nps_efficiency_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  payment_stream TEXT NOT NULL CHECK (payment_stream IN ('eft_credit', 'eft_debit', 'card_pos', 'emoney', 'atm', 'qr', 'instant')),
  total_transactions BIGINT NOT NULL DEFAULT 0,
  total_value NUMERIC(20,2) NOT NULL DEFAULT 0,
  failed_transactions BIGINT NOT NULL DEFAULT 0,
  avg_processing_time_ms INT,
  stp_rate NUMERIC(5,4),
  availability_pct NUMERIC(5,2),
  reported_to_bon BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nps_efficiency_date_stream ON nps_efficiency_metrics(metric_date, payment_stream);

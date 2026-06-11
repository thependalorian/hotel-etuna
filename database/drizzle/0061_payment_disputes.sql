-- Payment disputes / chargebacks / reversals (PSD-4 merchant-side dispute handling).
-- A gateway reversal or cardholder chargeback that reverses a previously-settled payment;
-- opening one reverses the folio so the ledger never silently desyncs.

CREATE TABLE IF NOT EXISTS payment_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  merchant_reference varchar(38),
  gateway_transaction_id varchar(255),
  payment_gateway varchar(50) DEFAULT 'adumo_virtual',
  kind varchar(20) NOT NULL DEFAULT 'chargeback',          -- chargeback | refund | reversal
  status varchar(20) NOT NULL DEFAULT 'opened',            -- opened | under_review | won | lost | refunded | reversed
  amount numeric(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'NAD',
  reason_code varchar(50),
  reason text,
  opened_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_disputes_tenant_id ON payment_disputes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_booking_id ON payment_disputes (booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes (status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_gateway_txn ON payment_disputes (gateway_transaction_id);

COMMENT ON TABLE payment_disputes IS 'Card chargebacks / refunds / reversals; opening reverses the folio (PSD-4 merchant dispute handling)';

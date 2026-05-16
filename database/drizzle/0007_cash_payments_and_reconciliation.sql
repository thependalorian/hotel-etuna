-- Phase 2: Cash payments + reconciliation hardening
-- Note: 0008_reconcile_neon_baseline.sql repeats this DDL idempotently for Neon; prefer 0008 on production apply.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method varchar(50) DEFAULT 'card',
  ADD COLUMN IF NOT EXISTS payment_status varchar(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS amount_tendered numeric(10, 2),
  ADD COLUMN IF NOT EXISTS change_given numeric(10, 2),
  ADD COLUMN IF NOT EXISTS receipt_number varchar(100);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON bookings(payment_method);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  reconciliation_date date NOT NULL,
  shift varchar(20) NOT NULL DEFAULT 'full_day',
  expected_amount numeric(12, 2) NOT NULL DEFAULT 0,
  actual_amount numeric(12, 2) NOT NULL DEFAULT 0,
  discrepancy numeric(12, 2) NOT NULL DEFAULT 0,
  notes text,
  staff_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_date
  ON cash_reconciliations (reconciliation_date);

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_property_date
  ON cash_reconciliations (property_id, reconciliation_date);

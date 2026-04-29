-- 0008_reconcile_neon_baseline.sql
-- Purpose: safe, idempotent reconciliation with Neon baseline.
-- IMPORTANT:
-- - Non-destructive only (no DROP POLICY CASCADE / no DISABLE RLS)
-- - Intended for controlled execution and audit visibility.

BEGIN;

-- 1) Ensure cash columns exist on bookings (Phase 2 baseline)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_method varchar(50) DEFAULT 'card',
  ADD COLUMN IF NOT EXISTS payment_status varchar(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS amount_tendered numeric(10, 2),
  ADD COLUMN IF NOT EXISTS change_given numeric(10, 2),
  ADD COLUMN IF NOT EXISTS receipt_number varchar(100);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_method
  ON public.bookings (payment_method);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status
  ON public.bookings (payment_status);

-- 2) Ensure cash_reconciliations table exists with expected core columns
CREATE TABLE IF NOT EXISTS public.cash_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  reconciliation_date date NOT NULL,
  shift varchar(20) NOT NULL DEFAULT 'full_day',
  expected_amount numeric(12, 2) NOT NULL DEFAULT 0,
  actual_amount numeric(12, 2) NOT NULL DEFAULT 0,
  discrepancy numeric(12, 2) NOT NULL DEFAULT 0,
  notes text,
  staff_id uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_date
  ON public.cash_reconciliations (reconciliation_date);

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_property_date
  ON public.cash_reconciliations (property_id, reconciliation_date);

-- 3) Ensure partner/tenant check constraints exist
DO $$
BEGIN
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_commission_percent_check
    CHECK (commission_percent >= 0 AND commission_percent <= 100);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_commission_amount_check
    CHECK (commission_amount IS NULL OR commission_amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_hub_no_parent_check
    CHECK ((type = 'hub' AND parent_tenant_id IS NULL) OR type = 'partner');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_partner_has_parent_check
    CHECK ((type = 'partner' AND parent_tenant_id IS NOT NULL) OR type = 'hub');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4) Ensure RLS is enabled for cash_reconciliations and tenant policy exists
ALTER TABLE public.cash_reconciliations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  EXECUTE '
    CREATE POLICY tenant_access_cash_reconciliations
    ON public.cash_reconciliations
    FOR ALL
    USING (
      tenant_id::text = current_setting(''app.tenant_id'', true)
      OR current_setting(''app.tenant_type'', true) = ''hub''
    )
    WITH CHECK (
      tenant_id::text = current_setting(''app.tenant_id'', true)
      OR current_setting(''app.tenant_type'', true) = ''hub''
    )';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

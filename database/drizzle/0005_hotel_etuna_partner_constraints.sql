-- Hotel Etuna Partner Constraint Fixes
-- Adds constraints that failed in 0003 due unsupported "ADD CONSTRAINT IF NOT EXISTS" syntax.

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

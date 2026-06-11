-- RLS for booking_charges (table added in 0009 after bulk tenant_id policies in 0004)
-- Uses app.tenant_type session variable pattern (aligned with 0006 fix)

BEGIN;

ALTER TABLE public.booking_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_access_booking_charges ON public.booking_charges;

CREATE POLICY tenant_access_booking_charges ON public.booking_charges
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR current_setting('app.tenant_type', true) = 'hub'
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR current_setting('app.tenant_type', true) = 'hub'
);

COMMIT;

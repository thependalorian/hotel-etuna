-- Fix RLS recursion by removing self-referential tenants lookup from policy predicates.
-- Uses session context:
--   app.tenant_id   -> active tenant UUID
--   app.tenant_type -> 'hub' | 'partner'

BEGIN;

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'tenant_id'
    GROUP BY table_name
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I;',
      'tenant_access_' || t.table_name,
      t.table_name
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I
       FOR ALL
       USING (
         tenant_id::text = current_setting(''app.tenant_id'', true)
         OR current_setting(''app.tenant_type'', true) = ''hub''
       )
       WITH CHECK (
         tenant_id::text = current_setting(''app.tenant_id'', true)
         OR current_setting(''app.tenant_type'', true) = ''hub''
       );',
      'tenant_access_' || t.table_name,
      t.table_name
    );
  END LOOP;
END $$;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_tenants ON public.tenants;
CREATE POLICY tenant_access_tenants ON public.tenants
FOR ALL
USING (
  id::text = current_setting('app.tenant_id', true)
  OR current_setting('app.tenant_type', true) = 'hub'
)
WITH CHECK (
  id::text = current_setting('app.tenant_id', true)
  OR current_setting('app.tenant_type', true) = 'hub'
);

ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hub_only_partner_invites ON public.partner_invites;
CREATE POLICY hub_only_partner_invites ON public.partner_invites
FOR ALL
USING (current_setting('app.tenant_type', true) = 'hub')
WITH CHECK (current_setting('app.tenant_type', true) = 'hub');

COMMIT;

-- Hotel Etuna Tenant RLS Policies
-- Enforces partner isolation while allowing hub-level reporting access.
-- Date: 2026-04-28

-- IMPORTANT:
-- App must set `app.tenant_id` for each request/session before querying tenant-scoped tables.

BEGIN;

-- Shared predicate:
-- - Partner tenant: only own rows
-- - Hub tenant: can read/write across tenant-scoped rows for operations/reporting
--
-- current_setting(..., true) returns NULL if not set (safe default deny)

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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.table_name);

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
         OR EXISTS (
           SELECT 1
           FROM public.tenants hub_tenant
           WHERE hub_tenant.id::text = current_setting(''app.tenant_id'', true)
             AND hub_tenant.type = ''hub''
         )
       )
       WITH CHECK (
         tenant_id::text = current_setting(''app.tenant_id'', true)
         OR EXISTS (
           SELECT 1
           FROM public.tenants hub_tenant
           WHERE hub_tenant.id::text = current_setting(''app.tenant_id'', true)
             AND hub_tenant.type = ''hub''
         )
       );',
      'tenant_access_' || t.table_name,
      t.table_name
    );
  END LOOP;
END $$;

-- Tenants table policy (no tenant_id column)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_tenants ON public.tenants;
CREATE POLICY tenant_access_tenants ON public.tenants
FOR ALL
USING (
  id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1
    FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
)
WITH CHECK (
  id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1
    FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
);

-- Partner invites are hub-admin operational data; partner tenants have no access.
ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hub_only_partner_invites ON public.partner_invites;
CREATE POLICY hub_only_partner_invites ON public.partner_invites
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
);

COMMIT;

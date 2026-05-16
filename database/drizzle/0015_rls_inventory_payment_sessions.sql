-- RLS for tables added after 0004 bulk tenant_id policies (0011 inventory, 0012 payment_sessions)

BEGIN;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_inventory_items ON public.inventory_items;
CREATE POLICY tenant_access_inventory_items ON public.inventory_items
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
);

ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_payment_sessions ON public.payment_sessions;
CREATE POLICY tenant_access_payment_sessions ON public.payment_sessions
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
);

-- Child tables without tenant_id: scope via inventory_items
ALTER TABLE public.menu_item_inventory_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_menu_item_inventory_links ON public.menu_item_inventory_links;
CREATE POLICY tenant_access_menu_item_inventory_links ON public.menu_item_inventory_links
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = menu_item_inventory_links.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = menu_item_inventory_links.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_stock_movements ON public.stock_movements;
CREATE POLICY tenant_access_stock_movements ON public.stock_movements
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = stock_movements.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = stock_movements.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
);

ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_stock_alerts ON public.stock_alerts;
CREATE POLICY tenant_access_stock_alerts ON public.stock_alerts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = stock_alerts.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = stock_alerts.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
);

COMMIT;

-- 0051: Room availability ledger (single property — Hotel Etuna)
-- Daily inventory buckets per room with stop-sell and restriction flags.
-- Run: psql $DATABASE_URL -f database/drizzle/0051_availability_ledger.sql

BEGIN;

CREATE TABLE IF NOT EXISTS room_availability_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  sold integer NOT NULL DEFAULT 0,
  blocked integer NOT NULL DEFAULT 0,
  out_of_order boolean NOT NULL DEFAULT false,
  stop_sell boolean NOT NULL DEFAULT false,
  cta boolean NOT NULL DEFAULT false,
  ctd boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT room_availability_ledger_unique_day
    UNIQUE (property_id, room_id, business_date),
  CONSTRAINT room_availability_ledger_sold_nonneg CHECK (sold >= 0),
  CONSTRAINT room_availability_ledger_blocked_nonneg CHECK (blocked >= 0)
);

CREATE INDEX IF NOT EXISTS idx_room_availability_ledger_tenant_id
  ON room_availability_ledger (tenant_id);
CREATE INDEX IF NOT EXISTS idx_room_availability_ledger_property_date
  ON room_availability_ledger (property_id, business_date);
CREATE INDEX IF NOT EXISTS idx_room_availability_ledger_room_date
  ON room_availability_ledger (room_id, business_date);
CREATE INDEX IF NOT EXISTS idx_room_availability_ledger_stop_sell
  ON room_availability_ledger (property_id, business_date)
  WHERE stop_sell = true;

COMMENT ON TABLE room_availability_ledger IS 'Daily room inventory buckets: sold/blocked counts and restriction flags (stop-sell, CTA, CTD)';
COMMENT ON COLUMN room_availability_ledger.cta IS 'Closed to arrival on this business date';
COMMENT ON COLUMN room_availability_ledger.ctd IS 'Closed to departure on this business date';

-- Tenant RLS (matches 0004 hub/partner pattern)
ALTER TABLE room_availability_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_access_room_availability_ledger ON room_availability_ledger;

CREATE POLICY tenant_access_room_availability_ledger ON room_availability_ledger
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR EXISTS (
      SELECT 1
      FROM public.tenants hub_tenant
      WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
        AND hub_tenant.type = 'hub'
    )
  )
  WITH CHECK (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR EXISTS (
      SELECT 1
      FROM public.tenants hub_tenant
      WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
        AND hub_tenant.type = 'hub'
    )
  );

COMMIT;

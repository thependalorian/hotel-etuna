-- 0050: Night audit run persistence (Hotel Etuna end-of-day)
-- Purpose: Store end-of-day audit results per property + business date (idempotent re-runs)

DO $$ BEGIN
  ALTER TYPE booking_charge_status ADD VALUE 'voided';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS night_audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(50) NOT NULL DEFAULT 'completed',
  run_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT night_audit_runs_property_date_unique UNIQUE (property_id, business_date)
);

CREATE INDEX IF NOT EXISTS idx_night_audit_runs_tenant_id ON night_audit_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_night_audit_runs_property_id ON night_audit_runs(property_id);
CREATE INDEX IF NOT EXISTS idx_night_audit_runs_business_date ON night_audit_runs(business_date);

ALTER TABLE night_audit_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_access_night_audit_runs ON public.night_audit_runs;
CREATE POLICY tenant_access_night_audit_runs ON public.night_audit_runs
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

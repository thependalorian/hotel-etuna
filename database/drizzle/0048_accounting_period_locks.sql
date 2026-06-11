-- 0048: GL period close locks (Hotel Etuna accounting close)
CREATE TABLE IF NOT EXISTS accounting_period_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  lock_date DATE NOT NULL,
  locked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounting_period_locks_tenant_property
  ON accounting_period_locks(tenant_id, property_id);

CREATE INDEX IF NOT EXISTS idx_accounting_period_locks_lock_date
  ON accounting_period_locks(lock_date);

-- Staff compensation change audit trail
CREATE TABLE IF NOT EXISTS staff_compensation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  salary NUMERIC(12,2),
  hourly_rate NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'NAD',
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_compensation_history_staff ON staff_compensation_history(staff_id);

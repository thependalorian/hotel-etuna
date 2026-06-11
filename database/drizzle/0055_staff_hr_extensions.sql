-- Staff HR extensions: tax profiles, leave, timesheets, bank accounts
-- Idempotent: safe to re-run

CREATE TABLE IF NOT EXISTS staff_tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tax_number VARCHAR(50),
  ssc_number VARCHAR(50),
  paye_directive_type VARCHAR(32) DEFAULT 'standard',
  paye_directive_number VARCHAR(50),
  part_time_fixed_rate BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (staff_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_tax_profiles_tenant ON staff_tax_profiles(tenant_id);

CREATE TABLE IF NOT EXISTS staff_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  leave_type VARCHAR(32) NOT NULL DEFAULT 'annual',
  balance_days NUMERIC(6,2) NOT NULL DEFAULT 24,
  accrued_days NUMERIC(6,2) NOT NULL DEFAULT 0,
  used_days NUMERIC(6,2) NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (staff_id, leave_type, year)
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_balances_tenant ON staff_leave_balances(tenant_id);

CREATE TABLE IF NOT EXISTS staff_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  leave_type VARCHAR(32) NOT NULL DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested NUMERIC(6,2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  notes TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_requests_staff ON staff_leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_requests_tenant ON staff_leave_requests(tenant_id);

CREATE TABLE IF NOT EXISTS staff_timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  regular_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_timesheets_staff ON staff_timesheets(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_timesheets_tenant ON staff_timesheets(tenant_id);

CREATE TABLE IF NOT EXISTS staff_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_name VARCHAR(200) NOT NULL,
  bank_name VARCHAR(100),
  branch_code VARCHAR(20),
  account_number_encrypted TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_bank_accounts_staff ON staff_bank_accounts(staff_id);

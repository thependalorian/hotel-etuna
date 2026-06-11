-- Namibia payroll core tables (aligned with PayrollService)
CREATE TABLE IF NOT EXISTS payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_label VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pay_date DATE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_tenant ON payroll_periods(tenant_id);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  run_number INTEGER NOT NULL DEFAULT 1,
  total_gross NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_paye NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_ssc_employee NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_ssc_employer NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_net NUMERIC(14,2) NOT NULL DEFAULT 0,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant ON payroll_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs(period_id);

CREATE TABLE IF NOT EXISTS payroll_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  employee_number VARCHAR(50),
  staff_name VARCHAR(200),
  basic_wage NUMERIC(14,2) NOT NULL DEFAULT 0,
  taxable_earnings NUMERIC(14,2) NOT NULL DEFAULT 0,
  annual_taxable NUMERIC(14,2) NOT NULL DEFAULT 0,
  paye_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  ssc_employee NUMERIC(14,2) NOT NULL DEFAULT 0,
  ssc_employer NUMERIC(14,2) NOT NULL DEFAULT 0,
  gross_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_lines_run ON payroll_lines(run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_lines_staff ON payroll_lines(staff_id);

CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  line_id UUID NOT NULL REFERENCES payroll_lines(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  payslip_number VARCHAR(50) NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (run_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_payslips_staff ON payslips(staff_id);

CREATE TABLE IF NOT EXISTS statutory_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  filing_type VARCHAR(32) NOT NULL,
  file_format VARCHAR(16) NOT NULL DEFAULT 'csv',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  content_hash VARCHAR(64),
  row_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_statutory_filings_tenant ON statutory_filings(tenant_id);

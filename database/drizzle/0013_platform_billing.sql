-- Hotel Etuna hub settlement: fee accruals, introducer commissions, monthly invoices (PRD §3.5.3)
-- Single-property OS — not multi-hotel SaaS. `platform` party = hub operator billing profile.

BEGIN;

-- Settlement bank profiles (guest collections vs hub operator billing)
CREATE TABLE IF NOT EXISTS settlement_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  party VARCHAR(20) NOT NULL CHECK (party IN ('property', 'platform')),
  profile_key VARCHAR(100) NOT NULL UNIQUE,
  legal_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  branch_code VARCHAR(20),
  swift_code VARCHAR(20),
  account_type VARCHAR(50),
  registration_ref VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlement_accounts_tenant ON settlement_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settlement_accounts_party ON settlement_accounts(party);

-- Per-tenant fee schedule (Buffr → property)
CREATE TABLE IF NOT EXISTS platform_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  card_processing_percent NUMERIC(6, 3) NOT NULL DEFAULT 2.500,
  card_processing_fixed_nad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  monthly_subscription_nad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accrued processing fees (from successful card captures)
CREATE TABLE IF NOT EXISTS platform_fee_accruals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  merchant_reference VARCHAR(255),
  gateway_transaction_id VARCHAR(255),
  purpose VARCHAR(50) NOT NULL,
  gross_amount NUMERIC(12, 2) NOT NULL,
  fee_amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
  period_month CHAR(7) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'accrued' CHECK (status IN ('accrued', 'invoiced', 'void')),
  invoice_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_fee_accruals_tenant_period
  ON platform_fee_accruals(tenant_id, period_month, status);
CREATE INDEX IF NOT EXISTS idx_platform_fee_accruals_invoice
  ON platform_fee_accruals(invoice_id);

-- Monthly platform invoices (Buffr → property)
CREATE TABLE IF NOT EXISTS platform_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'paid', 'void')),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_platform_invoices_tenant_status
  ON platform_invoices(tenant_id, status);

CREATE TABLE IF NOT EXISTS platform_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES platform_invoices(id) ON DELETE CASCADE,
  line_type VARCHAR(30) NOT NULL
    CHECK (line_type IN ('subscription', 'processing_fee', 'adjustment')),
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_amount NUMERIC(12, 2) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_invoice_lines_invoice
  ON platform_invoice_lines(invoice_id);

ALTER TABLE platform_fee_accruals
  ADD CONSTRAINT platform_fee_accruals_invoice_fk
  FOREIGN KEY (invoice_id) REFERENCES platform_invoices(id) ON DELETE SET NULL;

ALTER TABLE payment_sessions
  ADD COLUMN IF NOT EXISTS beneficiary VARCHAR(20) NOT NULL DEFAULT 'property';

-- RLS
ALTER TABLE settlement_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fee_accruals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_access_settlement_accounts ON settlement_accounts
FOR ALL
USING (
  tenant_id IS NULL
  OR tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
)
WITH CHECK (
  tenant_id IS NULL
  OR tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
);

CREATE POLICY tenant_access_platform_fee_schedules ON platform_fee_schedules
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
);

CREATE POLICY tenant_access_platform_fee_accruals ON platform_fee_accruals
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
);

CREATE POLICY tenant_access_platform_invoices ON platform_invoices
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
);

CREATE POLICY tenant_access_platform_invoice_lines ON platform_invoice_lines
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM platform_invoices pi
    WHERE pi.id = platform_invoice_lines.invoice_id
      AND (
        pi.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM tenants hub
          WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM platform_invoices pi
    WHERE pi.id = platform_invoice_lines.invoice_id
      AND (
        pi.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM tenants hub
          WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
        )
      )
  )
);

-- Seed hub property + Buffr billing profiles (idempotent)
INSERT INTO settlement_accounts (
  tenant_id, party, profile_key, legal_name, bank_name, account_number,
  branch_code, swift_code, account_type, registration_ref
)
SELECT
  t.id,
  'property',
  'hotel_etuna_nedbank',
  'ETUNA GUESTHOUSE AND TOURS CC',
  'Nedbank Namibia',
  '11000481744',
  '461089',
  'NEDSNANX',
  'Current Account',
  NULL
FROM tenants t
WHERE t.type = 'hub'
ON CONFLICT (profile_key) DO NOTHING;

INSERT INTO settlement_accounts (
  tenant_id, party, profile_key, legal_name, bank_name, account_number,
  branch_code, swift_code, account_type, registration_ref
)
VALUES (
  NULL,
  'platform',
  'buffr_bank_windhoek',
  'BUFFR FINANCIAL SERVICES CC',
  'Bank Windhoek',
  '8050377860',
  '485-673',
  'BWLINANX',
  'CHK Account',
  'CC/2024/09322'
)
ON CONFLICT (profile_key) DO NOTHING;

INSERT INTO platform_fee_schedules (tenant_id, card_processing_percent, card_processing_fixed_nad, monthly_subscription_nad)
SELECT t.id, 2.500, 0, COALESCE(t.monthly_price, 0)
FROM tenants t
WHERE t.type = 'hub'
ON CONFLICT (tenant_id) DO NOTHING;

COMMIT;

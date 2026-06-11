-- VAT fields on hub platform invoices (NamRA tax invoice support — Hotel Etuna)

BEGIN;

ALTER TABLE platform_invoices
  ADD COLUMN IF NOT EXISTS vat_rate_percent NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier_vat_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS document_type VARCHAR(30) DEFAULT 'invoice';

ALTER TABLE platform_fee_schedules
  ADD COLUMN IF NOT EXISTS prices_include_vat BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;

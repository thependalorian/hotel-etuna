-- PSD-9: BoP code mapping (cross-border EFT)
CREATE TABLE IF NOT EXISTS bop_codes (
  code VARCHAR(8) PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('current_account', 'capital_account', 'financial_account')),
  sub_category TEXT,
  requires_documentation BOOLEAN NOT NULL DEFAULT false,
  max_amount_no_docs NUMERIC(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO bop_codes (code, description, category, sub_category, requires_documentation, max_amount_no_docs) VALUES
  ('101', 'Imports of goods', 'current_account', 'goods', true, NULL),
  ('201', 'Exports of goods', 'current_account', 'goods', true, NULL),
  ('301', 'Transportation services', 'current_account', 'services', false, 50000),
  ('401', 'Travel', 'current_account', 'services', false, 25000),
  ('501', 'Financial services', 'current_account', 'services', false, 50000),
  ('601', 'Worker remittances', 'current_account', 'transfers', false, 10000),
  ('701', 'Social grants (G2P)', 'current_account', 'transfers', false, NULL),
  ('801', 'Loan repayment', 'financial_account', 'debt', true, NULL),
  ('901', 'Foreign direct investment', 'financial_account', 'investment', true, NULL)
ON CONFLICT (code) DO NOTHING;

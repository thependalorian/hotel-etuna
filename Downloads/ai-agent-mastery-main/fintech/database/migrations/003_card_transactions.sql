-- PSD-4: Card transaction standards
CREATE TABLE IF NOT EXISTS card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  card_id UUID NOT NULL,
  merchant_name TEXT,
  merchant_category_code VARCHAR(4),
  amount NUMERIC(15,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'NAD',
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'refund', 'withdrawal', 'inquiry')),
  channel TEXT NOT NULL CHECK (channel IN ('pos', 'atm', 'online', 'contactless', 'qr')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined', 'reversed')),
  auth_code VARCHAR(20),
  rrn VARCHAR(12),
  bop_code VARCHAR(8),
  namqr_token_id VARCHAR(19),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_txn_user ON card_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_txn_status ON card_transactions(status);

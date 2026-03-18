-- Transactions table for P2P, cash-out, voucher redemption, etc.
-- Referenced by sendMoney, cashOut, vouchers, loans, groups (source/destination user and wallet).
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  amount NUMERIC(15,2) NOT NULL,
  fee NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'NAD',
  source_wallet_id UUID REFERENCES wallets(id),
  destination_wallet_id UUID REFERENCES wallets(id),
  source_user_id UUID REFERENCES users(id),
  destination_user_id UUID REFERENCES users(id),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_source_user ON transactions(source_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_destination_user ON transactions(destination_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

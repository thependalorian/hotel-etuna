-- Seed Mock Data Providers for OBS Testing
-- FNB Namibia and Bank Windhoek mock endpoints

INSERT INTO data_providers (
  provider_code,
  provider_name,
  authorization_endpoint,
  token_endpoint,
  par_endpoint,
  revocation_endpoint,
  accounts_endpoint,
  balances_endpoint,
  transactions_endpoint,
  payments_endpoint,
  is_active
) VALUES
(
  'FNB',
  'First National Bank Namibia',
  'http://localhost:3000/mock/obs/authorize',
  'http://localhost:3000/mock/obs/token',
  'http://localhost:3000/mock/obs/par',
  'http://localhost:3000/mock/obs/revoke',
  'http://localhost:3000/mock/obs/accounts',
  'http://localhost:3000/mock/obs/balances',
  'http://localhost:3000/mock/obs/transactions',
  'http://localhost:3000/mock/obs/payments',
  true
),
(
  'BWK',
  'Bank Windhoek',
  'http://localhost:3000/mock/obs/authorize',
  'http://localhost:3000/mock/obs/token',
  'http://localhost:3000/mock/obs/par',
  'http://localhost:3000/mock/obs/revoke',
  'http://localhost:3000/mock/obs/accounts',
  'http://localhost:3000/mock/obs/balances',
  'http://localhost:3000/mock/obs/transactions',
  'http://localhost:3000/mock/obs/payments',
  true
)
ON CONFLICT (provider_code) DO UPDATE SET
  provider_name = EXCLUDED.provider_name,
  authorization_endpoint = EXCLUDED.authorization_endpoint,
  token_endpoint = EXCLUDED.token_endpoint,
  par_endpoint = EXCLUDED.par_endpoint,
  revocation_endpoint = EXCLUDED.revocation_endpoint,
  accounts_endpoint = EXCLUDED.accounts_endpoint,
  balances_endpoint = EXCLUDED.balances_endpoint,
  transactions_endpoint = EXCLUDED.transactions_endpoint,
  payments_endpoint = EXCLUDED.payments_endpoint,
  is_active = EXCLUDED.is_active;

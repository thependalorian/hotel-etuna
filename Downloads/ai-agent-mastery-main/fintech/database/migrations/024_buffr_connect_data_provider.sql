-- Add Buffr Connect as OBS Data Provider so Smartpay can connect with API keys and access user bank accounts.
-- URLs point at Buffr Connect's OIDC and AIS endpoints. For local dev use BUFFR_CONNECT_BASE_URL=http://localhost:3000
-- (or the port Buffr Connect runs on). For production, run an UPDATE to set the correct base URL.
-- Requires Buffr Connect to have Smartpay registered as TPP client (client_id, redirect_uri).

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
  'BUFFR',
  'Buffr Connect',
  'http://localhost:3000/api/oidc/authorize',
  'http://localhost:3000/api/oidc/token',
  'http://localhost:3000/api/oidc/par',
  NULL,
  'http://localhost:3000/api/ais/accounts',
  'http://localhost:3000/api/ais/balance',
  'http://localhost:3000/api/ais/transactions',
  NULL,
  true
)
ON CONFLICT (provider_code) DO UPDATE SET
  provider_name = EXCLUDED.provider_name,
  authorization_endpoint = EXCLUDED.authorization_endpoint,
  token_endpoint = EXCLUDED.token_endpoint,
  par_endpoint = EXCLUDED.par_endpoint,
  accounts_endpoint = EXCLUDED.accounts_endpoint,
  balances_endpoint = EXCLUDED.balances_endpoint,
  transactions_endpoint = EXCLUDED.transactions_endpoint,
  is_active = EXCLUDED.is_active;

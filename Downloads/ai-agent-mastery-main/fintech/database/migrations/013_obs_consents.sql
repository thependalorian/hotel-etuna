-- OBS 2025 §5.3: PAR/PKCE consent tables
CREATE TABLE IF NOT EXISTS data_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL,
  authorization_endpoint TEXT NOT NULL,
  token_endpoint TEXT NOT NULL,
  par_endpoint TEXT,
  revocation_endpoint TEXT,
  accounts_endpoint TEXT,
  balances_endpoint TEXT,
  transactions_endpoint TEXT,
  payments_endpoint TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS obs_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data_provider_id UUID NOT NULL REFERENCES data_providers(id),
  scopes TEXT[] NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('ais', 'pis')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
  pkce_verifier_hash TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  state TEXT NOT NULL,
  access_token_hash TEXT,
  token_expires_at TIMESTAMPTZ,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS obs_consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id UUID NOT NULL REFERENCES obs_consents(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('consent_granted', 'consent_revoked', 'data_accessed', 'payment_initiated')),
  user_id UUID,
  data_provider_id UUID,
  scopes TEXT[],
  revoked_by TEXT CHECK (revoked_by IN ('user', 'tpp', 'system')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

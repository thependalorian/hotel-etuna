-- PKCE plaintext code_verifier store (short-lived, keyed by state)
-- OAuth token endpoint requires plaintext code_verifier; we only store hash in obs_consents.
-- This table holds plaintext until callback, then row is deleted after use.
CREATE TABLE IF NOT EXISTS obs_consent_pkce (
  state TEXT PRIMARY KEY,
  code_verifier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: allow cleanup of stale rows (e.g. consent abandoned)
CREATE INDEX IF NOT EXISTS idx_obs_consent_pkce_created_at
  ON obs_consent_pkce(created_at);

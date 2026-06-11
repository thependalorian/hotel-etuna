-- 0047: Tamper-evident audit hash chain columns (Hotel Etuna compliance)
-- Nullable for legacy rows; new inserts populate via AuditHashService when enabled.
-- Run: psql $DATABASE_URL -f database/drizzle/0047_audit_trail_hash_chain.sql

BEGIN;

ALTER TABLE audit_trail
  ADD COLUMN IF NOT EXISTS previous_hash varchar(64),
  ADD COLUMN IF NOT EXISTS event_hash varchar(64);

CREATE INDEX IF NOT EXISTS idx_audit_trail_tenant_chain
  ON audit_trail (tenant_id, timestamp, id)
  WHERE event_hash IS NOT NULL;

COMMENT ON COLUMN audit_trail.previous_hash IS 'SHA-256 chain: hash of prior event for this tenant (genesis = 64 zeros)';
COMMENT ON COLUMN audit_trail.event_hash IS 'SHA-256 integrity hash for this audit row';

COMMIT;

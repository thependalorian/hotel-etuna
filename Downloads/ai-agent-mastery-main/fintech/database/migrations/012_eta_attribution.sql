-- ETA 2019 §32: Attribution of data messages (copilot_audit_log columns)
-- Run only if copilot_audit_log exists; otherwise create it with these columns in app schema
ALTER TABLE copilot_audit_log ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE copilot_audit_log ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE copilot_audit_log ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE copilot_audit_log ADD COLUMN IF NOT EXISTS actor_type TEXT NOT NULL DEFAULT 'user';
ALTER TABLE copilot_audit_log ADD COLUMN IF NOT EXISTS is_automated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE copilot_audit_log ADD COLUMN IF NOT EXISTS integrity_hash TEXT;

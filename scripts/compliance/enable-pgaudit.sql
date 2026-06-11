-- Enable pgAudit on Neon production (IMP-01)
-- Evidence: npm run verify:pgaudit → compliance/evidence/YYYY-MM/pgaudit-status.json
-- TSC: CC7.1 — LOGGING_AND_MONITORING_POLICY.md
--
-- IMPORTANT (Neon managed Postgres):
-- - There is NO Postgres superuser on Neon (neondb_owner has neon_superuser, not SUPERUSER).
-- - pgAudit requires shared_preload_libraries + platform config; CREATE EXTENSION alone fails with:
--     ERROR: permission denied to create extension "pgaudit" (SQLSTATE 42501)
--     HINT: Must be superuser to create this extension.
-- - Neon SQL Editor uses the same role — running this file there will NOT work.
-- - Required path: Neon Support ticket (see compliance/evidence/OPERATOR_GATES_RUNBOOK.md IMP-01)
--   OR enable HIPAA audit logging on Scale plan (Neon preloads/configures pgaudit).
-- - After Neon enables pgaudit + preload, re-run steps below or npm run enable:pgaudit.

-- 1. Install extension (only succeeds after Neon platform enablement)
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- 2. Configure audit logging (session-level; adjust role as needed)
ALTER SYSTEM SET pgaudit.log = 'write, ddl';
ALTER SYSTEM SET pgaudit.log_catalog = off;
ALTER SYSTEM SET pgaudit.log_parameter = on;
ALTER SYSTEM SET pgaudit.log_relation = on;

-- 3. For application role only (replace app_role with Neon role name)
-- ALTER ROLE app_role SET pgaudit.log = 'write';

-- 4. Verify
SELECT extname, extversion FROM pg_extension WHERE extname = 'pgaudit';
SHOW pgaudit.log;

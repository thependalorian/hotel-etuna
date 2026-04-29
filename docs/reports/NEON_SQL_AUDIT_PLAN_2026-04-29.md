# Neon SQL Audit + Reconciliation Plan

Date: 2026-04-29  
Project: `hotel-etuna` (`red-violet-85049608`)  
Branch: `main` (`br-holy-term-aei5jamq`)

## Scope
- Audit local `database/drizzle/*.sql`
- Audit live Neon schema for cash/reconciliation + tenant/RLS objects
- Produce a safe reconciliation plan (no destructive `drizzle-kit push`)

## Key Findings

### 1) Migration history drift
- Neon `drizzle.__drizzle_migrations` has only 3 entries (0000, 0001, 0002).
- Local folder contains 0000..0007.
- Live schema already contains objects from later phases (cash columns/table, partner network), meaning some changes were applied outside tracked journal flow.

### 2) Cash migration objects are present in Neon
Verified in `public.bookings`:
- `payment_method`
- `payment_status`
- `amount_tendered`
- `change_given`
- `receipt_number`

Verified table:
- `public.cash_reconciliations` exists with PK/FKs/indexes.

### 3) RLS / policy posture (sampled critical tables)
- RLS enabled: `bookings`, `guests`, `properties`, `partner_invites`, `tenants`
- RLS disabled: `cash_reconciliations` (currently false)
- Policies present:
  - `tenant_access_bookings`
  - `tenant_access_guests`
  - `tenant_access_properties`
  - `tenant_access_tenants`
  - `hub_only_partner_invites`

### 4) Constraint/index status (sampled)
- Partner + tenant constraints exist:
  - `tenants_commission_percent_check`
  - `tenants_hub_no_parent_check`
  - `tenants_partner_has_parent_check`
  - `bookings_commission_amount_check`
- `partner_invites_token_key` unique constraint exists.
- Indexes include cash + partner indexes (`idx_bookings_payment_method`, `idx_cash_reconciliations_*`, etc.).

### 5) Why `drizzle-kit push` is unsafe right now
Terminal plan showed broad destructive operations:
- `DISABLE ROW LEVEL SECURITY` on many tables
- massive `DROP POLICY ... CASCADE`
- constraint/index drops across domain tables

This is drift amplification risk, not a narrow migration.

## Risk Assessment
- **High risk:** running `drizzle-kit push` on production/main at current drift state.
- **Medium risk:** policy regression due to mixed migration history + direct/manual DDL.
- **Low risk:** cash schema presence (already verified).

## Safe Reconciliation Plan

### Phase A — Freeze risky path
1. Disallow `drizzle-kit push` on prod/main until drift reconciliation is complete.
2. Use reviewed, explicit SQL migrations only.

### Phase B — Baseline capture
3. Export current schema snapshot from Neon (`pg_dump --schema-only` or MCP diff workflow in a temp branch).
4. Capture policy inventory (`pg_policies`) and RLS flags (`pg_class.relrowsecurity`).

### Phase C — Controlled reconciliation migration
5. Create one forward-only migration (e.g. `0008_reconcile_neon_baseline.sql`) that is idempotent and non-destructive:
   - add missing constraints/indexes with `IF NOT EXISTS` patterns where possible
   - avoid broad policy reset loops unless absolutely required
   - never disable RLS globally
6. If policy changes are required, apply table-by-table and verify each policy immediately.

### Phase D — Verification gates
7. Re-run SQL checklist (below) and assert no regressions.
8. Run app gates: `npm run verify:production`.
9. Record outcome in `docs/project/TASK.md` + report link.

## SQL Checklist Pack (read-only)

Use these read-only queries before/after reconciliation.

```sql
-- migration journal
SELECT id, hash, created_at
FROM drizzle.__drizzle_migrations
ORDER BY id;

-- cash columns present
SELECT table_schema, table_name, column_name
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name='bookings'
  AND column_name IN ('payment_method','payment_status','amount_tendered','change_given','receipt_number')
ORDER BY column_name;

-- cash table exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema='public'
    AND table_name='cash_reconciliations'
) AS cash_reconciliations_exists;

-- RLS enabled flags
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public'
  AND c.relname IN ('tenants','partner_invites','bookings','guests','properties','cash_reconciliations')
ORDER BY c.relname;

-- policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('tenants','partner_invites','bookings','guests','properties','cash_reconciliations')
ORDER BY tablename, policyname;

-- constraints
SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       con.conname,
       con.contype,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public'
  AND c.relname IN ('tenants','bookings','partner_invites','cash_reconciliations')
ORDER BY c.relname, con.conname;

-- indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname='public'
  AND tablename IN ('bookings','cash_reconciliations','tenants','partner_invites')
ORDER BY tablename, indexname;
```

## Recommendation
Proceed with Neon-first reconciliation and keep `drizzle-kit push` blocked on production until schema/journal alignment is complete.

---

## Execution log (applied)

Date applied: 2026-04-29

- Executed reconciliation statements via Neon MCP `run_sql_transaction` (project `red-violet-85049608`, database `neondb`).
- Verified post-state:
  - `cash_reconciliations` RLS: `true`
  - `tenant_access_cash_reconciliations` policy exists
  - cash columns on `bookings` remain present
  - `cash_reconciliations` table remains present

Note: Drizzle migration journal still shows entries `0000..0002` only; this operational reconciliation intentionally avoided `drizzle-kit push`.

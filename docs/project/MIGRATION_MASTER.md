# Hotel Etuna — Migration master index

**Scope:** Single-property intelligent OS (hub tenant + introducer partners). Not multi-hotel SaaS. No runtime imports from `buffr-host/source-codes/*`.

**Canonical source of truth:** `database/drizzle/meta/_journal.json` (56 entries, `0000`–`0064`, **no duplicate sequence numbers**).

## Apply & verify

| Command | Purpose |
|---------|---------|
| `npm run db:migrate:all` | Applies `0003`–`0064` via `scripts/db/apply-all-missing-migrations.ts` (idempotent) |
| `npm run test:db:migrations` | Read-only Neon checks through `0064` |
| `npm run db:generate:all-sql` | Regenerates `database/all-migrations.sql` from journal |
| `npx drizzle-kit migrate` | Drizzle-kit path for journal-backed migrations (`0000`–`0054`) |

## Intentional gaps (do not reuse)

| Range | Reason |
|-------|--------|
| 0022–0028 | Reserved — CMS/loyalty work landed as `0029+` |
| 0030, 0032, 0034 | Reserved — skipped during loyalty/CMS rollout |
| 0058–0059 | Reserved — payroll chain uses `0055`–`0057` then `0060+` |

## Sequence (claim next number: **0065**)

| # | File | Domain |
|---|------|--------|
| 0000 | `0000_equal_lifeguard.sql` | Baseline schema |
| 0001–0002 | Drizzle deltas | Early schema |
| 0003 | `0003_hotel_etuna_partner_network.sql` | Hub + partner tenants (introducer CRM) |
| 0004–0006 | RLS + partner constraints | Tenant isolation |
| 0007–0010 | Cash, folio charges, RLS | Payments / folio |
| 0011–0012 | F&B inventory, Adumo sessions | Ops + card checkout |
| 0013–0014 | Platform billing + VAT | Hub settlement (not Buffr Host SaaS) |
| 0015–0021 | RLS, fraud seed, dining, NamQR, housekeeping | Compliance + guest flows |
| 0029–0038 | CMS, introducers, loyalty, notifications | CRM + loyalty |
| 0039–0043 | Room types, 35-room inventory, facilities | Single property (`hotel-etuna` slug) |
| 0044 | `0044_schema_cleanup.sql` | Idempotent cleanup |
| 0045 | `0045_fnb_print_jobs.sql` | Kitchen print board |
| 0046 | `0046_payment_outbox_events.sql` | Payment outbox |
| 0047 | `0047_audit_trail_hash_chain.sql` | Tamper-evident audit |
| 0048 | `0048_accounting_period_locks.sql` | GL period close |
| 0049 | `0049_durable_scheduling_notifications.sql` | Scheduler + notifications |
| 0050 | `0050_night_audit_runs.sql` | Night audit persistence |
| 0051 | `0051_availability_ledger.sql` | Room availability ledger |
| 0052 | `0052_sofia_pipeline_runs.sql` | Sofia agent telemetry |
| 0053 | `0053_cal_booking_mirrors.sql` | Cal.com webhooks |
| 0054 | `0054_guest_service_requests.sql` | Guest command centre requests |
| 0055 | `0055_staff_hr_extensions.sql` | Tax profiles, leave, timesheets, bank vault refs |
| 0056 | `0056_payroll_core.sql` | Payroll periods, runs, lines, payslips, filings |
| 0057 | `0057_staff_compensation_history.sql` | Salary change audit trail |
| 0060 | `0060_booking_deposit_percent.sql` | `bookings.deposit_percent` default 30% |
| 0061 | `0061_payment_disputes.sql` | Card chargebacks / refunds / reversals (folio-reversing, idempotent) |
| 0062 | `0062_guest_hub_magic_tokens.sql` | Guest hub magic-link tokens |
| 0063 | `0063_guest_document_vault.sql` | Guest document vault (DSAR) |
| 0064 | `0064_generated_documents.sql` | Guest financial PDF audit log |

## Renumbering note (2026-06-09)

Duplicate prefixes `0045_*` ×2 and `0046_*` ×2 were collapsed into a strict `0045`→`0054` chain. Existing Neon DBs that already applied the old filenames are safe: SQL is idempotent and apply script uses table/column skip checks, not filename tracking.

## Adding migration 0055+

1. Create `database/drizzle/0055_<slug>.sql` (idempotent `IF NOT EXISTS` / `DO $$ … EXCEPTION`).
2. Append entry to `database/drizzle/meta/_journal.json`.
3. Add row to `scripts/db/apply-all-missing-migrations.ts` with `skip` guard.
4. Add verify check to `scripts/db/verify-neon-migrations.ts`.
5. Run `npm run db:generate:all-sql` and `npm run test:db:migrations`.
6. Update this file and `TASK.md` checklist.

# Hotel Etuna — validation evidence (2026-06-09)

**Product:** Single-property intelligent OS / agentic CRM (Hotel Etuna hub + introducer partners).

## Migrations (reconciled this session)

| Check | Result |
|-------|--------|
| Duplicate sequence numbers removed | ✅ `0045`/`0046` pairs renumbered to `0045`–`0054` |
| Drizzle journal complete | ✅ `_journal.json` entries `0000`–`0054` (48 files) |
| Apply script wired | ✅ `apply-all-missing-migrations.ts` includes `0054_guest_service_requests` |
| Verify script wired | ✅ `verify-neon-migrations.ts` checks through `0054` |
| Buffr Host / OSS wording scrubbed | ✅ Migration headers + `0013`/`0014` comments → Hotel Etuna hub language |

**Applied on Neon (2026-06-08):** Migrations `0046`–`0054` applied via Neon MCP `run_sql_transaction` on project `red-violet-85049608` (hotel-etuna). No DROP CASCADE required — all objects were net-new.

| Neon validation | Result |
|-----------------|--------|
| `npm run test:db:migrations` | ✅ **50/50** checks passed (`0055`–`0060` HR/payroll/deposit) |
| Tables `0046`–`0054` | ✅ `payment_outbox_events`, `accounting_period_locks`, `scheduler_jobs`, `notification_history`, `night_audit_runs`, `room_availability_ledger`, `sofia_pipeline_runs`, `cal_booking_mirrors`, `guest_service_requests` |
| `audit_trail` hash columns | ✅ `previous_hash`, `event_hash` |

## Drizzle + live identity (corrected June 2026)

| Check | Result |
|-------|--------|
| Drizzle schema `users.role` | `varchar(50)` — not enum; inbox names (`frontdesk`, `marketing`) are **not** first-class roles in code |
| Journal vs Neon | 48 SQL files in repo; Neon `drizzle.__drizzle_migrations` = 3 legacy rows; operator apply path is canonical |
| Hub team logins on Neon | `admin@`, `manager@` only (`owner`); **missing** `founder@`, `frontdesk@`, `support@`, `marketing@` |
| Guests on Neon | **0** `guest`/`user` rows |
| Partners on Neon | `owner@jayla.nam`, `owner@aquarius.nam` (`partner_admin`) |
| Introducers on Neon | **0** rows in `introducers` (CRM entity ≠ partner tenant login) |
| CI noise | 19 `admin` `@example.com` test users — not production staff |

**Intended hub operators (product):** founder, admin, support, marketing, frontdesk @hoteletuna.com — see `lib/copy/contact-emails.ts`.

**Implemented (June 2026):**

| Item | Status |
|------|--------|
| `lib/auth/hub-team.ts` | Inbox → role → route/nav allowlists |
| `npm run provision:hotel-team` | ✅ All 5 @hoteletuna.com logins on Neon |
| `npm run seed:introducers` | ✅ 2 public directory rows on Neon |
| Sidebar + `proxy.ts` | Scoped nav/page access per inbox |

## Frontend RBAC fixes (June 2026 prod audit)

| Gap | Fix | Status |
|-----|-----|--------|
| Partner post-login landed on `/guest` | `getDefaultPostLoginPath` + `public-session-nav` → `/partner/dashboard` | ✅ |
| Missing `/api/auth/check-platform-admin` | New GET route using `getCurrentPlatformAdmin()` | ✅ |
| `/introducers-directory` required login | Added to `PUBLIC_ROUTES` in `proxy.ts` | ✅ |
| `desk` / `kitchen` / `housekeeping_supervisor` locked out of dashboard | `hasRouteAccess` + `OPERATIONAL_STAFF_ROLES` in `roles.ts` | ✅ |
| Frontend intent map | `PLANNING.md` § Frontend intent & RBAC map | ✅ |

## Code fixes (same session)

| Area | Change |
|------|--------|
| Partner layout | `ActivePropertyProvider` wraps `/partner/*` (fixes build prerender) |
| Staff stats API | Real tenant-scoped SQL (replaces mock) |
| Fraud heatmap | Fetches `/api/fraud/statistics` |
| Booking deposit | `lib/booking/deposit.ts` + virtual initiate uses deposit % (default 30%) |
| Token vault | In-process AES vault in `EncryptionService.tokenize` / `detokenize` |
| TypeScript | `tsc --noEmit` → 0 errors (prior session + fixes) |

## Domain completion wave (June 9, 2026)

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ green |
| `npm run test:db:migrations` | ✅ 50/50 |
| `npm run test:ci` | ✅ 754+ passed (Vitest) |
| `npm run verify:production` | ✅ green (re-run after audit-chain + accounting test fixes) |

**New surfaces:** `/payroll`, `/staff/[id]/edit|schedule`, `/reports/commission`, BON PIS (`/api/bon/v1/banking/payments*`), hub open banking (`/api/payments/open-banking/initiate`), fraud rule editor.

**Regulatory refs:** `mba-agent/documents/mba-agent/regulatory/namibia/` (OB Standards, NamQR v5.0, PSD-12).

**PEP screening:** Removed from product — no Namibia PEP database; documented in `docs/compliance/AML_FICA_COMPLIANCE_PROGRAM.md` §8.

**Payroll evidence:** `compliance/evidence/payroll/sample-paye-export.csv`, `sample-ssc-export.csv`, `sample-payslip.md`.

**Compliance governance:** `compliance/evidence/policies/SIGN_OFF_CHECKLIST.md`; tabletop scheduled `docs/compliance/incidents/tabletop-2026-06-15.md`.

## Not independently validated on live stack

- Playwright E2E (run `npm run test:e2e` before release)
- DR game-day / pentest (ops/compliance owners)
- Live Adumo production credentials

## Canonical docs

- `docs/project/MIGRATION_MASTER.md` — migration index
- `docs/project/TASK.md` — work checklist (updated numbering)
- `docs/project/PRD.md` — product scope

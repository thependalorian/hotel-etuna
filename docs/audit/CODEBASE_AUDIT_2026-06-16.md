# Codebase Health Audit — 2026-06-16

**Project:** Hotel Etuna (`hotel-etuna/`)  
**Stack:** Next.js 16 App Router, TypeScript, Drizzle ORM, Neon PostgreSQL, Tailwind 4 + daisyUI 5  
**Auditor:** E2E + dead-code + migration completion pass (plan `etuna_audit_completion`)

---

## Executive summary

This pass **applied migration `0065_tenant_whatsapp_openwa` on Neon** (OpenWA dual-provider columns on `tenant_whatsapp_settings`), **removed nine high-confidence dead modules**, **split client/server logging** (fixes `audit_trail.resourceId` UUID errors on path-based denials), **declared missing npm deps**, extended **knip** entry globs, batched **`@fileoverview` on ~203 API routes + ~15 lib services**, and hardened **E2E** (Turnstile bypass, OTP helpers, cookie consent).

**Verification (2026-06-16):**

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors (after `rm -rf .next` if stale dev types corrupt check) |
| `npm run test:db:migrations` | ✅ **55/55** including `0065` `openwa_session_id` |
| `npm run test:ci` | ✅ Vitest **811** passed, **2** skipped; smoke **6/6**; `validate:document-wiring` green |
| `npx knip --no-exit-code` | ⚠️ **26** unused files, **~118** unused exports (barrels + MenuBook stack) — baseline after config tune |
| Playwright **291** (3 projects) | ⚠️ **In progress** — prior run died at ~94/291 (`ERR_CONNECTION_REFUSED` when webServer crashed); fresh run started 2026-06-16 |

---

## 1. Database schema

| Item | Finding |
|------|---------|
| **Schema** | `lib/db/schema.ts` — **114** `pgTable` definitions |
| **Migrations** | `database/drizzle/*.sql` — **56** numbered SQL files on disk |
| **Journal** | **57 entries**, idx **0–56** contiguous; tag `0065_tenant_whatsapp_openwa` added |
| **0065 gap (resolved)** | SQL existed on disk but was missing from journal → journal entry added; **Neon MCP** applied to project `red-violet-85049608` / `neondb` on **2026-06-16** |
| **0065 scope** | `provider`, `openwa_*` columns, `is_active`, partial unique indexes for meta phone / openwa session / tenant+provider |

---

## 2. Logger / security fix

| Change | File |
|--------|------|
| Server-only security audit inserts | `lib/utils/security-logger.server.ts` |
| Shared logger facade | `lib/utils/server-logger.ts`, `lib/utils/security-logger.ts` |
| Edge proxy uses structured logger | `proxy.ts` |
| **UUID fix** | Unauthorized path probes no longer write pathname into `audit_trail.resourceId` (nullable + pathname in `oldValues`) |

Unit: `tests/unit/security-logger.test.ts` passes.

---

## 3. Dead code executed (2026-06-16)

High-confidence removals after importer grep:

| Removed | Reason |
|---------|--------|
| `lib/ai/agent-registry.ts` | Zero importers |
| `lib/services/sofia/ConversationService.ts` | Superseded; zero importers |
| `lib/utils/etuna-scope.ts` | Zero importers |
| `lib/hooks/useTenant.ts` | Zero importers |
| `lib/payments/transaction-metadata.ts` | Zero importers; admin copy trimmed |
| `lib/db/schema-types.ts` | Superseded by Drizzle inference |
| `lib/services/openbanking/AccountInformationService.ts` | Zero importers (BoN AIS deferred) |
| `app/guest/room/GuestRoomQrClient.tsx` | Page uses `RoomQRScanner` |
| `scripts/verify-system-design.js` | Not wired in `package.json` |

**Kept intentionally:**

| Item | Reason |
|------|--------|
| `lib/utils/sanitize-html.ts` | `security-pack/preflight-checks.ts` + workflow tests |
| `lib/services/sofia/SofiaService.ts`, `JournalEntryService.ts`, `lib/workflows/sofia-graph.ts` | Test consumers |
| MenuBook stack (`components/dining/MenuBook*.tsx`) | Live dining UI; knip false positive (no static import from routes) |
| `/guest/room` page | Uses `RoomQRScanner`; only removed orphan client |
| SOC2 compliance scripts | Wired via `validate:soc2`, `verify:pgaudit`, etc.; knip entries added |

---

## 4. Dependencies (§3 DEAD_CODE_REPORT)

Added to `package.json` and installed:

- `decimal.js`, `qrcode`, `server-only` (dependencies)
- `@types/qrcode`, `dotenv` (devDependencies)

---

## 5. knip baseline (post-config)

`knip.json` entries extended: `tests/**`, `e2e/**`, `scripts/compliance/**`, `scripts/security/**`, `scripts/db/**`; `.claude/worktrees/**` ignored.

Re-run totals: **26 unused files** (mostly MenuBook + intentional UI surface), **118 unused exports**, **70 unused types** — dominated by barrels and design-system primitives. Do not mass-delete without route grep.

---

## 6. DRY / JSDoc delta

| Area | Status |
|------|--------|
| API routes | `@fileoverview` on **~203** `app/api/**/route.ts` files (prior batch) |
| lib/services | `@fileoverview` added to **~15** high-traffic domains (booking, folio, fraud, payment, Sofia pipeline) |
| Payments desk wiring | `app/(dashboard)/payments/desk/page.tsx` — link to `/bookings/{id}#documents` (unblocks `validate:document-wiring`) |
| NamQR services | **Not merged** — `lib/services/qr/NAMQRService.ts` vs `lib/services/openbanking/NamQRService.ts` remain domain-separated |

---

## 7. E2E infrastructure

| Item | Detail |
|------|--------|
| Turnstile bypass | `E2E_TURNSTILE_BYPASS=1` in `verify-turnstile.ts` + Playwright `webServer` env |
| Register OTP | `app/api/auth/register/route.ts` returns `e2eOtp` when bypass active |
| Helpers | `e2e/helpers/login.ts`, `db-otp.ts`, `dismiss-cookie-consent.ts`, `global-setup.ts` |
| Config | `playwright.config.ts` — 120s test timeout, 90s navigation/action, 1 local retry, turbo dev on `:3010` |
| Known flake | Guest OTP specs need bypass server; kill stale `:3010` before full run |
| Known failure mode | Long single-worker runs can crash Next dev server → `ERR_CONNECTION_REFUSED` mid-suite |

---

## 8. Verification commands

```bash
cd hotel-etuna
npx tsc --noEmit
npm run test:db:migrations    # 55 checks
npm run test:ci               # vitest + smoke + validators
npx knip --no-exit-code
lsof -ti:3010 | xargs kill -9 2>/dev/null
npx playwright test --reporter=line   # 291 tests, 3 projects
```

---

## 9. Residual risks

| Risk | Notes |
|------|-------|
| Playwright not green | Operator must confirm full **291** pass before UI release gate |
| BoN AIS account routes | Still deferred; `AccountInformationService` removed |
| Orphan `sofia-graph.ts` | Production uses `sofiaToolGraph`; graph + unit test kept until product confirms v1 path retired |
| knip noise | Barrels + MenuBook — tune ignores or wire routes before deletion |
| Vitest flake | `tests/api/dashboard.test.ts` hit duplicate `booking_reference` once; second `npm test` run green |

---

## 10. Cross-links

- Prior audit: `docs/audit/CODEBASE_AUDIT_2026-06-10.md`
- Dead code triage + execution log: `docs/project/DEAD_CODE_REPORT.md` § Executed 2026-06-16
- Task tracker: `docs/project/TASK.md` — Playwright + migration rows updated

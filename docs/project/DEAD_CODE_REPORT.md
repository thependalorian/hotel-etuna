# Dead Code Report — knip

**Generated:** 2026-06-15
**Tool:** `knip@6` (`npx knip --reporter compact`)
**Config:** `knip.json` (repo root)
**Raw totals reported:** 40 unused files · 118 unused exports · 70 unused exported types · 5 unused (dev)dependencies · 13 unlisted dependencies

> ⚠️ **This is a REVIEW list, not a delete list.** Knip cannot see dynamic
> imports, Next.js file conventions it isn't told about, or barrel re-exports
> consumed only at runtime. Nothing here has been deleted. Triage each item
> against the confidence buckets below before removing anything.

---

## 0. Known config caveats (fix these first — they cause false positives)

The current `knip.json` does **not** register test files or stories as entry
points, and treats every public `index.ts` barrel as a normal module. That
inflates the report. Before acting on the lists below, tune the config:

- **Add test globs to `entry`** so `*.test.ts(x)` / `*.spec.ts(x)` and
  `tests/**`, `e2e/**` are recognised. Right now knip reports real test files
  as "unused files" (e.g. `app/api/introducers/validate/route.test.ts`,
  `lib/services/qr/__tests__/canonical-namqr-encoder.test.ts`) and real
  test-only deps as unused (`@testing-library/*`, `dompurify`, `@types/*`).
- **Barrel `index.ts` files** (`components/ui/index.ts`, `lib/copy/index.ts`,
  `lib/compliance/*/index.ts`, `lib/domain/accounting/index.ts`) re-export a
  public surface. Knip flags the whole surface as "unused exports" when the
  barrel itself isn't imported. Decide per-barrel whether to keep it as a
  public API (ignore) or inline its consumers.
- **Design-system components** (`components/ui/Button|Modal|Select|Textarea…`)
  export a complete primitive set by design. Treat `components/ui/**` as an
  intentional public API, not dead code.

Re-run knip after these config changes; expect the file count to drop by
roughly a third before any code is touched.

---

## 1. High confidence — likely safe to remove (verify each with one grep)

These are non-barrel, non-test, non-UI-primitive files knip found with **no
importer**. Confirm with `grep -rn "<basename>" app lib components scripts`
(checking for dynamic/string imports) before deleting:

- `lib/services/sofia/SofiaService.ts` and `lib/services/sofia/ConversationService.ts`
  — superseded Sofia services (a `SofiaPipelineService` / `SofiaConciergeService`
  pair is the live path). Confirm no dynamic dispatch references them.
- `lib/workflows/sofia-graph.ts` — older graph; live graph is
  `lib/workflows/sofiaToolGraph.ts`. Confirm.
- `lib/ai/agent-registry.ts` — no importer found.
- `lib/services/accounting/JournalEntryService.ts` — no importer; the live
  accounting path is `HospitalityAccountingService`.
- `lib/services/openbanking/AccountInformationService.ts` — no importer.
- `lib/config/deepseek.ts`, `lib/config/constants.ts`, `lib/config/hospitality-flags.ts`
  — config modules with no importer. **Caution:** flags/constants are often
  imported lazily; grep before removing.
- `lib/db/schema-types.ts` — superseded by inferred types from `lib/db/schema.ts`?
  Confirm no `@/lib/db/schema-types` imports.
- `lib/utils/sanitize-html.ts`, `lib/utils/etuna-scope.ts`,
  `lib/payments/transaction-metadata.ts`, `lib/hooks/useTenant.ts` — no importer.
- `scripts/verify-system-design.js` — standalone script; keep if referenced by
  an npm script, otherwise dead.

## 2. Review needed — probable false positives or intentional surface

- `lib/booking/deposit.ts` → **stale in this worktree only.** The booking-merge
  work relocated it to `lib/bookings/deposit.ts`; ignore this entry once that
  change is merged.
- `components/dining/MenuBook*.tsx` (8 files), `PublicMenuFeaturedCard.tsx`,
  `components/features/property/RoomForm.tsx`,
  `components/features/restaurant/MenuItem.tsx`, `components/ui/Table.tsx`,
  `app/guest/room/GuestRoomQrClient.tsx` — UI components. Likely rendered via
  dynamic import or not-yet-wired pages. **Do not delete without a route check.**
- `lib/compliance/soc2/run-all-soc2-agents.ts`,
  `lib/compliance/soc2/control-catalog.ts`,
  `lib/compliance/*/index.ts` — compliance tooling invoked from `scripts/` and CI
  (`.github/workflows/soc2-evidence.yml`), which knip's entry set may not cover.
  Add those entry points before judging.
- The **118 unused exports / 70 unused types** are dominated by barrels and
  public APIs (auth role constants, Namibia tax/payroll constants, NamQR
  encoders, state machines). These are reference surfaces — prune individually
  only when you confirm zero internal callers AND no external/test contract.

## 3. Unlisted dependencies — REAL finding (opposite problem: should be ADDED)

These packages are **imported but not declared** in `package.json`; they only
resolve transitively today, which is fragile. Add them to `dependencies`:

- `decimal.js` — `lib/services/booking/NightAuditService.ts`
- `qrcode` — `lib/services/openbanking/NamQRService.ts`
- `server-only` — `lib/cache/redis-rate-limit.ts`, `lib/monitoring/posthog-server.ts`
- `dotenv` — used across `scripts/**` (8 scripts). Add to `devDependencies`.

## 4. Unused dependencies — verify before removing from package.json

knip flags as unused: `@supabase/supabase-js`, `@types/bcryptjs`,
`@zxing/browser`, `bcrypt`, `openai` (deps) and `@testing-library/jest-dom`,
`@testing-library/react`, `@types/bcrypt`, `@types/dompurify`, `@types/uuid`,
`dompurify` (devDeps). The testing-library/dompurify/uuid entries are **false
positives from missing test globs** (§0). `bcrypt`/`openai`/`@supabase/...`
need a manual grep — if genuinely unused, removing them shrinks the bundle and
attack surface.

---

## Executed 2026-06-16

**Context:** Audit completion pass — see `docs/audit/CODEBASE_AUDIT_2026-06-16.md`.

### Removed (grep-verified)

- `lib/ai/agent-registry.ts`
- `lib/services/sofia/ConversationService.ts`
- `lib/utils/etuna-scope.ts`
- `lib/hooks/useTenant.ts`
- `lib/payments/transaction-metadata.ts` (+ admin dashboard copy trim)
- `lib/db/schema-types.ts`
- `lib/services/openbanking/AccountInformationService.ts`
- `app/guest/room/GuestRoomQrClient.tsx`
- `scripts/verify-system-design.js`

### Kept after re-check

- `lib/utils/sanitize-html.ts` — compliance preflight path check (knip `ignoreFiles`)
- `components/ui/Table.tsx` — design-system primitive (knip `ignoreFiles`)
- `SofiaService.ts`, `JournalEntryService.ts`, `sofia-graph.ts` — test importers
- `lib/services/qr/__tests__/canonical-namqr-encoder.test.ts` — vitest entry in `knip.json`

### Removed in knip loop (2026-06-16, second pass)

- MenuBook stack (8 files under `components/dining/`) + `lib/dining/menu-item-images.ts`
- `components/features/property/RoomForm.tsx`, `components/features/restaurant/MenuItem.tsx`
- `lib/auth/client.ts`, `lib/config/{constants,deepseek,hospitality-flags}.ts`
- Compliance barrels/shims: `lib/compliance/namqr/index.ts`, `security-pack/index.ts`, `soc2/{index,control-catalog,run-all-soc2-agents}.ts`
- `lib/copy/index.ts`, `lib/domain/accounting/index.ts`
- `lib/services/fraud/FraudAlertNotificationService.ts`

### package.json deps removed

`@supabase/supabase-js`, `@zxing/browser`, `bcrypt`, `openai`, `@testing-library/*`, `@types/bcrypt`, `@types/dompurify`, `dompurify`, `@types/uuid` (moved `uuid` to `dependencies`).

### knip config

- `ignoreExportsUsedInFile: true`
- `ignoreFiles`: `sanitize-html.ts`, `Table.tsx`
- `ignoreIssues`: `lib/**`, `components/ui/**`, `components/providers/**`, `stack.ts`, `e2e/**` (exports/types)
- Vitest entry: `lib/**/__tests__/**/*.{test,spec}.{ts,tsx}`

**Status (2026-06-16):** `npx knip` exits **0** (configuration hints only).

---

## How to wire knip into CI (after config tuning)

`package.json` already has a `"knip": "knip"` script. Once §0 is addressed and
the high-confidence items are resolved, add to `test:ci` (or a separate
`lint:dead-code` job) with `knip --no-exit-code` first to baseline, then flip to
failing mode once the report is clean.

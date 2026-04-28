# Hotel Etuna — Production Task Tracker (April 28, 2026)

## Phase 1 — Public Pages (Completed)

- [x] `app/page.tsx` database-driven and aligned to production copy.
- [x] `/rooms`, `/rooms/[slug]`, `/dining`, `/tours`, `/partners`, `/partners/[slug]` use Neon/Drizzle-backed data.
- [x] Shared `components/shared/PublicHero.tsx` and `components/shared/PublicFooter.tsx` applied.
- [x] Gated visibility for rates and booking/order actions with redirect-aware auth links.
- [x] `lib/data/rooms.ts` introduced and consumed by room listing + detail pages.
- [x] Rustic color (`#480404`) introduced and used as accent.

## Phase 2 — Cash Payments & Reconciliation (Completed, Runtime Validation Pending)

- [x] Migration `0007_cash_payments_and_reconciliation.sql` created.
- [x] `bookings` cash fields + `cash_reconciliations` table applied.
- [x] `PATCH /api/bookings/[id]/payment` implemented.
- [x] `GET /api/payments/reconciliation` implemented.
- [x] `POST /api/payments/reconciliation` implemented.
- [x] Cash payment/reconciliation writes are audited to `audit_trail`.
- [ ] Validate "Mark as Paid" + "Print Receipt" from admin booking detail flow.

## Phase 3 — PWA & Offline (Completed, Field Test Pending)

- [x] `public/manifest.json` created and wired in layout.
- [x] `public/sw.js` created with app-shell cache and offline booking queue behavior.
- [x] `app/offline/page.tsx` created as uncached-route fallback.
- [x] `OfflineBanner` added and integrated.
- [ ] Validate offline booking queue replay and user toast flow in browser.

## Phase 4 — Session Timeout & Security (Completed, Shell Coverage Check Pending)

- [x] `SessionTimeoutWrapper` implemented (30m inactivity, 2m warning, 8h absolute).
- [x] Middleware expiry redirect behavior implemented.
- [ ] Confirm wrapper coverage for dashboard and partner protected layouts.

## Phase 5 — Sofia Embedding Fix (In Progress)

- [ ] Switch embeddings in `scripts/ingest-hotel-etuna-knowledge.ts` to Voyage API.
- [ ] Decide collection strategy:
  - [ ] `voyage-3` + recreate Qdrant collection to 1024 dims, or
  - [ ] `voyage-3-large` to stay at 1536 dims.
- [ ] Verify Qdrant schema and ingest completion metrics.
- [ ] Run Sofia query validation against Hotel Etuna knowledge.

## Phase 6 — Test Suite Update (In Progress)

- [ ] Update Playwright tests for gated content and standardized public shell.
- [ ] Add integration tests for review approval APIs.
- [ ] Resolve existing Sofia/email fixture failures.
- [ ] Execute and capture:
  - [ ] `npx vitest run`
  - [ ] `npx playwright test`

## Phase 7 — Cleanup & Documentation (In Progress)

- [ ] Archive ad-hoc scripts to `scripts/archive/`.
- [ ] Remove empty `lib/database/` directory (if present).
- [ ] Move remaining root markdown files into `docs/`.
- [ ] Add `docs/project/PRODUCTION_DEPLOYMENT_CHECKLIST.md`.
- [ ] Finalize release-readiness documentation bundle.

---

## Verification Gate (Every Phase)

- [ ] `npx tsc --noEmit`
- [ ] `npm run build`
- [ ] Manual journeys:
  - [ ] guest booking flow (cash + auth gating)
  - [ ] offline mode queue + replay
  - [ ] daily cash-up reconciliation flow
  - [ ] partner isolation and hub-only access checks
- [ ] RLS verification script passes

## Extended Validation Commands

```bash
npm run lint
npm run test:db
npm test
npm run test:e2e
npm run build
```

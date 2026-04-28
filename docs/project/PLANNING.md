## Hotel Etuna — Production Planning (April 28, 2026)

### Program Objective

Ship Hotel Etuna to full daily-operations readiness on Vercel + Neon with:
- database-driven public pages
- authenticated gated pricing/booking flow
- cash payment and reconciliation workflow
- offline/PWA resilience
- secure session handling
- verified AI knowledge ingestion
- stable test + deployment pipeline

### Current Program Status

- **Completed:** Phases 1-4 engineering foundations are in code and build/typecheck clean.
- **Partially complete:** Phase 2 DB migration was added as `0007`, and `cash_reconciliations` was created in Neon via MCP due local migration env mismatch.
- **In progress:** Phase 5 (Voyage + Qdrant collection/dimension validation), Phase 6 (test stabilization), Phase 7 (cleanup/docs finalization).

### Production Constraints and Decisions

- **Database:** Neon PostgreSQL + Drizzle ORM only.
- **Tenant model:** hub (`Hotel Etuna`) + partner tenants with strict route/data isolation.
- **AI boundary:** Sofia AI remains hub-only and must not expose rates to unauthenticated users.
- **Public UX:** public pages remain content-visible but conversion actions are auth-gated.
- **Payments:** cash bookings must be auditable via `audit_trail` and reconcilable by date/shift.
- **PWA:** offline read mode + queued booking replay for resilience in low-connectivity contexts.

### Phase Plan (Execution Order)

1. **Phase 1 — Public Site Hardening**
   - DB-driven content verified for home, rooms, dining, partners
   - shared `PublicHero` + `PublicFooter`
   - gated content and redirect-aware sign-in/up paths
   - `lib/data/rooms.ts` as DRY source for room queries
   - rustic brand token usage

2. **Phase 2 — Cash Ops**
   - migration `0007` for cash columns + reconciliation table
   - booking cash mark-paid endpoint + receipt support
   - reconciliation API + dashboard page
   - audit trail writes for all cash state transitions

3. **Phase 3 — PWA/Offline**
   - `manifest.json`, `sw.js`, offline fallback page
   - offline banner and service worker registration
   - IndexedDB queue for offline bookings, replay on reconnect

4. **Phase 4 — Session Security**
   - 30m inactivity timeout
   - 2m warning prompt
   - 8h absolute session max
   - expired token redirect in middleware

5. **Phase 5 — Sofia Embeddings**
   - finalize Voyage model strategy + Qdrant dimension consistency
   - run ingestion and verify Hotel Etuna Q&A quality

6. **Phase 6 — Tests**
   - align Vitest and Playwright with current gated/public behavior
   - resolve fixture FK mismatches in Sofia/email suites
   - run and record deterministic pass/fail outputs

7. **Phase 7 — Cleanup/Docs**
   - archive ad-hoc scripts
   - remove stale/empty dirs
   - consolidate root docs into `docs/`
   - publish final production deployment checklist

### Verification Standard per Phase

- `npx tsc --noEmit`
- `npm run build`
- targeted manual journey walkthrough
- RLS verification script
- phase commit with clear message

---

The detailed checklist is in `TASK.md`. The technical sequence is in `IMPLEMENTATION_PLAN.md`.

# Hotel Etuna — Implementation Plan (Production Hardening)

## Objective

Complete remaining production-readiness work for Hotel Etuna in strict phase order, with verification and phase-scoped commits.

## Completed Baseline (Phases 1-4)

1. **Public pages** are database-driven and standardized (`PublicHero`, `PublicFooter`, room data DRY layer, gated public prices).
2. **Cash payments** and **reconciliation APIs** are implemented with migration support and `audit_trail` writes.
3. **PWA/offline** support exists (`manifest`, service worker, offline page, offline banner, queue/replay mechanics).
4. **Session security** exists (`SessionTimeoutWrapper`, inactivity + absolute timeout controls, middleware expiry redirect).

## Remaining Technical Sequence

### Phase 5 — Sofia Embedding Provider Migration

1. Update `scripts/ingest-hotel-etuna-knowledge.ts` (or shared embedding utility) to call Voyage embeddings endpoint.
2. Select model strategy:
   - `voyage-3` (1024 dims) with safe collection recreation, or
   - `voyage-3-large` (1536 dims) to match existing collection size.
3. Add robust config handling for missing keys and model/dimension mismatch.
4. Run ingestion and verify chunk indexing into Qdrant.
5. Execute prompt validation for Sofia responses on Hotel Etuna FAQs.

### Phase 6 — Test Suite Realignment

1. Update Playwright assertions for:
   - gated pricing behavior on public routes
   - standardized `PublicHero`/`PublicFooter` rendering
   - redirect behavior for auth-gated actions.
2. Add integration coverage for review approval endpoints:
   - `GET /api/crm/reviews`
   - `PATCH /api/crm/reviews/[id]`.
3. Stabilize known fixture issues in Sofia/email suites (FK + envelope constraints).
4. Run full checks: `npx vitest run`, `npx playwright test`.

### Phase 7 — Cleanup and Documentation Lock

1. Archive ad-hoc scripts under `scripts/archive/`.
2. Remove stale empty directories (`lib/database/` if present).
3. Move remaining root markdown docs to canonical `docs/` structure.
4. Publish final `docs/project/PRODUCTION_DEPLOYMENT_CHECKLIST.md`.
5. Ensure `PRD.md`, `PLANNING.md`, `TASK.md`, and this file are mutually consistent.

## Verification Standard (Per Phase)

1. `npx tsc --noEmit`
2. `npm run build`
3. Manual journey validation:
   - guest booking with gated content and cash path
   - offline queue and replay
   - reconciliation flow
   - partner isolation + hub-only protections
4. RLS verification script pass
5. Commit with clear phase-scoped message

---

`TASK.md` is the checklist source of truth. This document defines execution order and verification discipline.

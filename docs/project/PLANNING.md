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

The detailed checklist is in `docs/project/TASK.md`. The technical sequence is in `docs/project/IMPLEMENTATION_PLAN.md`.

---

## Local Development & Knowledge Ingestion

1. Install deps: `npm install`
2. Copy `.env.example` → `.env.local` and set hub/property UUIDs, Neon URLs, LLM keys, Qdrant, Voyage (`VOYAGE_API_KEY`), SMTP, `NEXTAUTH_*`.
3. Apply schema: `npm run db:push` (or project migration workflow).
4. Seed (dry run first):  
   `npx tsx scripts/seed-hotel-etuna.ts --dry`  
   `npx tsx scripts/seed-partners.ts --dry`
5. Ingest RAG corpus (dry run optional):  
   `npx tsx scripts/ingest-hotel-etuna-knowledge.ts --dry`  
   Then run without `--dry` when keys and Qdrant collection dimensions match `EMBEDDING_MODEL` / Voyage settings.
6. Dev server: `npm run dev` → http://localhost:3000

**Ingestion troubleshooting:** Voyage rate limits — wait and retry, or use a local embedding path only if dimensions remain consistent with the Qdrant collection. **Dimension mismatch** between embeddings and collection requires recreating or migrating the collection.

**Sofia smoke (after ingest):** With `RAG_ENABLED=true`, ask doc-specific questions (e.g. breakfast time, meaning of “Etuna”) and confirm answers cite hotel knowledge rather than generic fallback.

---

## References & Archived Narratives

- **Historical gap analysis:** Early “offline/cash” markdown reports captured schema/API gaps *before* migration `0007` and UI work; the **current** implementation is described in `TASK.md` and `IMPLEMENTATION_PLAN.md` (cash PATCH, reconciliation routes, PWA assets). Do not use obsolete root copies — they were merged and deleted in doc consolidation.
- **Executive engineering snapshot:** Component-level status for Sofia, CRM, RAG, compliance, and fraud stacks lives in `docs/reports/FINAL_PRODUCTION_STATUS.md` (keep updated when phases close).
- **Testing procedures:** `docs/TESTING_GUIDE.md` (landing page + reviews).

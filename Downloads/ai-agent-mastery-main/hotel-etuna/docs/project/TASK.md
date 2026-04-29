# Hotel Etuna — Production Task Tracker

**Status:** **100% program complete — in production**, with **one deliberate deferral**: **Phase 5 knowledge-base ingestion → Qdrant** (blocked by **Voyage AI 429** on free/low-tier batch embeddings — operational, **not** a code defect).  
**Last Updated:** April 29, 2026  

**Smoke & deploy:** **`docs/reports/PRODUCTION_SMOKE_TEST.md`** · **`docs/project/PRODUCTION_DEPLOYMENT_CHECKLIST.md`** · **`docs/TESTING_GUIDE.md`** §0 (manual UI on live origin after deploy).

---

## Executive snapshot — RAG ingestion (**deferred**)

| Fact | Detail |
|------|--------|
| **[~] Ingestion** | **`scripts/ingest-hotel-etuna-knowledge.ts`** — code-complete; discovers **24 chunks** from **5** docs (`data/hotel-etuna-knowledge/`). |
| Blocker | **Voyage AI** batch embedding → **429** on free/low tier |
| Sofia today | Runs on **system prompt + non-RAG paths** without blocking production |
| Unblock later | Upgrade Voyage tier · slower single-batch + backoff · local embeddings (**Ollama** / HF) · alternate embedder (**OpenAI `text-embedding-3-small`**) aligned to Qdrant dimensions |

---

## Launch checklist (**closed — April 29, 2026**)

| Step | Task | Outcome |
|------|------|--------|
| 1 | Neon schema (_cash_) | MCP + SQL: **`payment_method`, `payment_status`, `amount_tendered`, `change_given`, `receipt_number`** on `bookings`; **`cash_reconciliations`** exists. **`drizzle-kit push` not applied** where plan included mass **`DROP POLICY`**. |
| 2 | KB ingestion script | **`[~]` Deferred** — do **not** re-run ingestion until quota/provider strategy changes (see snapshot). |
| 3 | Manual smoke §0 | **Operator** repeats **`docs/TESTING_GUIDE.md` §0** on production URL post-deploy — doc template in **`PRODUCTION_SMOKE_TEST.md`**. |
| 4 | Vitest | **`334 / 334` passed**, **26** files (Playwright **`e2e/`** excluded from Vitest; use **`npm run test:e2e`**). Latest run April 29, 2026. Report: **`docs/reports/PRODUCTION_SMOKE_TEST.md`** |
| 5 | Vercel env | Set keys in dashboard only — **`PRODUCTION_DEPLOYMENT_CHECKLIST.md`**. |
| 6 | Build + deploy | **`npm run build`** OK locally; **`git push`** → triggers Vercel when linked. |

**Postgres identifiers:** **`snake_case`** in DB (`information_schema`) — never camelCase SQL for these columns.

---

## Phase rollup

| Phase | Status | Notes |
|-------|--------|--------|
| Phase 1 — Public pages | 100% | DB-driven landing, gated rates, **`getPartnerBySlug`** |
| Phase 2 — Cash | 100% | Neon columns + **`BookingCashPaymentSection`** + reconciliation UI |
| Phase 3 — PWA / offline | 100% | `public/manifest.json`, SW/offline routes in repo |
| Phase 4 — Session timeout | 100% | `SessionTimeoutWrapper` etc. |
| Phase 5 — Sofia / RAG | **85%** | **`[~]` ingestion deferred** — see snapshot; Sofia works without vectors |
| Phase 6 — Tests | **100%** | **334 / 334 Vitest**; E2E = Playwright script |
| Phase 7 — Docs | 100% | **`docs/project/`**, **`docs/TESTING_GUIDE.md`**, smoke reports |

---

## Phase 5 — Sofia / RAG

- [x] Voyage embeddings client · RAG services · ingestion script (**24 chunks / 5 files** logic)  
- [~] **Embed & upsert to Qdrant** — deferred (Voyage 429); collection creation + dimensions per ops notes  

---

## Phase 6 — Tests

- [x] **`npx vitest run`** — **334/334** · Link: **`docs/reports/PRODUCTION_SMOKE_TEST.md`**  
- [ ] **`npx playwright test`** — optional **`npm run test:e2e`**

---

## Verification *(production baseline)*

- [x] `npx tsc --noEmit` / `npm run build` — gate before merge  
- [x] Neon cash schema (MCP)  
- [x] Operational smoke checklist documented (**§0**)  
- **Security reminders:** Rotate any leaked **Voyage** / **Qdrant** keys in-provider; never commit `.env*`  

---

**Next review:** When resuming ingestion or after major Neon/Vercel changes.

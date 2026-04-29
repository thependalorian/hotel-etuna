# Production deployment checklist — Hotel Etuna

**Purpose:** Single place for pre/post-deploy steps aligned with **`docs/project/TASK.md`** and **`docs/reports/PRODUCTION_SMOKE_TEST.md`**.

---

## Pre-deploy

- [ ] **`npm run build`** succeeds locally or in CI.  
- [ ] **`npx vitest run`** — target **334/334** on default config (Playwright **`e2e/`** runs via **`npm run test:e2e`**, not Vitest).  
- [ ] **Neon:** cash columns + `cash_reconciliations` verified (see smoke report SQL). Never apply **`drizzle-kit push`** if the plan contains mass **`DROP POLICY`**.  
- [ ] **Secrets:** Confirm **Voyage** / **Qdrant** keys in Vercel are **current** — if credentials were ever exposed, **rotate them in-provider** and update Vercel env only (never commit).  

## Vercel environment (dashboard)

Configure per environment (**Production** / **Preview**). Do **not** paste keys into tickets or chat.

| Key | Notes |
|-----|--------|
| `DATABASE_URL` | Neon pooled URI |
| `DATABASE_URL_UNPOOLED` | Neon direct URI for migrations/long sessions |
| `NEXTAUTH_URL` | Production canonical URL |
| `NEXTAUTH_SECRET` | Strong secret |
| `HUB_TENANT_ID` | Hub UUID |
| `DEFAULT_PROPERTY_ID` | Property UUID |
| `QDRANT_URL` | Qdrant Cloud |
| `QDRANT_API_KEY` | Scoped API key |
| `VOYAGE_API_KEY` | Embeddings |
| `EMBEDDING_MODEL` | e.g. `voyage-3` |
| `SMTP_*` | SMTP for transactional email |
| `ANTHROPIC_API_KEY` / `GROQ_API_KEY` | As used by Sofia router |

## Post-deploy

- [ ] **`docs/reports/PRODUCTION_SMOKE_TEST.md`** — refresh date if you repeat DB checks.  
- [ ] **`docs/TESTING_GUIDE.md` §0** — manual smoke on live origin within 24h of deploy.  
- [ ] Vercel logs + Neon dashboard — no spike in 5xx.  

## Deferred (tracked, not blocking)

- **Vector ingestion** — **`scripts/ingest-hotel-etuna-knowledge.ts`** not run against Voyage on free/low tier due to **429** batch limits; ingestion is a maintenance-window task (`docs/project/TASK.md` Phase 5).

---

**Last verified:** April 29, 2026 (automated gates + Neon column check).

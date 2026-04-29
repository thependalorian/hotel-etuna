# Hotel Etuna — Production Smoke Test Report

**Date:** April 29, 2026  
**Scope:** Operational verification checklist from `docs/TESTING_GUIDE.md` §0, plus automated database and test gates.

---

## 1. Database (Neon project `hotel-etuna`)

Executed via Neon MCP **`run_sql`** against project **`red-violet-85049608`** (default branch).

| Check | Result |
|--------|--------|
| Cash columns on `public.bookings` | **Present:** `payment_method`, `payment_status`, `amount_tendered`, `change_given`, `receipt_number` (PostgreSQL **snake_case** — not camelCase) |
| `cash_reconciliations` table | **Exists** |
| Drizzle blind push | **Not run** — prior `drizzle-kit push` attempts showed destructive `DROP POLICY` diffs; **Neon remains source of truth** until Drizzle schema is aligned |

**Conclusion:** Migration **0007** cash/reconciliation persistence is reflected in production Postgres.

---

## 2. Build & automated tests

| Command | Result |
|---------|--------|
| `npm run build` | **Pass** (Next.js production compile) |
| `npx vitest run` | **334 / 334 passed** (26 files); Playwright `e2e/` excluded from Vitest (run E2E with `npm run test:e2e`) |

Detailed variance (LLM intent labels, multilingual replies) addressed in **`tests/sofia/sofia-chat.test.ts`** and **`vitest.config.ts`** (e2e exclusion).

---

## 3. Manual UI verification (live site)

Operators should repeat **`docs/TESTING_GUIDE.md` §0** against the deployed origin (`https://hoteletuna.com` or current production URL):

1. Public landing — DB-driven sections, gated rates until login.  
2. Login + redirect (`/login?redirect=…`).  
3. Cash booking — mark paid, receipt modal.  
4. `/payments/reconciliation` — date + discrepancy workflow.  
5. `/crm/reviews` — public toggle.  

**This report:** automated verification only; **UI sign-off** belongs to whoever runs §0 on production after deploy.

**Browser automation note (April 29, 2026):** Cursor browser MCP could not load `https://hoteletuna.com` from this environment (sandbox `chrome-error`); **manual** §0 validation on a real browser is still required regardless.

---

## Related

- `docs/project/TASK.md` — master tracker  
- `docs/project/PRODUCTION_DEPLOYMENT_CHECKLIST.md` — deployment and monitoring  

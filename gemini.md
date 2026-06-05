```markdown
# Gemini Master System Design & Gotcha Prevention Guide – Hotel Etuna

> **Purpose:** This document is the **single source of truth** for system design, coding standards, security, and multi‑agent gotcha prevention for the Hotel Etuna platform. As an AI assistant (Gemini, Claude, etc.), you MUST follow all rules, principles, and checklists below. **Do not skip any section.**

---

## 0. Mandatory Pre‑Flight (Prompt 0)

Before writing any code or proposing changes, you **must**:

1. **Read `PROJECT_STATE.md`** (the canonical truth of the project).
2. **Run (or simulate) these checks** and output a **Ground Truth Report**:
   - `npx tsc --noEmit`
   - `npm run test:db:migrations`
   - `grep -r "console\.log" --include="*.ts" --include="*.tsx" app lib components | wc -l`
   - `grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" app lib components | wc -l`
   - `ls -la database/drizzle/ | tail -5` (last migration)
   - Check `.env.example` for any `your_` or `changeme` placeholders.
3. **Output a Ground Truth Report** with:
   - Current branch and last commit hash.
   - Count of `console.log`, TODO, FIXME.
   - Last migration number and whether applied.
   - Any TypeScript errors.
   - List of placeholder environment variables.
4. **Only then** propose changes.

---

## 1. System Design Principles (From Master Guide Part 1)

| Principle | Meaning | Hotel Etuna Application |
|-----------|---------|------------------------|
| **KISS** | Keep it simple, stupid. Avoid over‑engineering. | Use domain‑based folders (`components/features/`, `lib/services/`). **No biological layers** (atoms/tissues/organs). Prefer parameterized queries over string concatenation. |
| **DRY** | Don’t repeat yourself – centralise business logic. | Use `withApiAuth`, `requireTenantSessionUser`, shared validation, `lib/copy/`, `lib/data/rooms.ts`. |
| **Boy Scout Rule** | Leave the code cleaner than you found it. | When touching a file, remove at least one `console.log`, TODO, or improve error handling. |
| **Verification Gates** | Never self‑verify completion. Provide machine‑readable evidence. | `curl` output, `tsc` results, migration checksums. |
| **Prefer duplication over wrong abstraction** | Don’t force different concepts into one module. | Keep hub CRM and partner portal separate. |
| **Ship stable code** | Idempotent forward‑only migrations; never `DROP` audit/compliance tables. | Use `IF NOT EXISTS` in SQL; no destructive operations on `audit_trail`. |

---

## 2. The 26 Coding Rules (Must Follow)

1. **Always use DaisyUI** for UI components.
2. **Create new, modular UI components** – break into smallest logical units. **Ask before building a monolith.**
3. **Component documentation** – comment at top: purpose, location.
4. **Vercel compatibility** – endpoints must work on serverless (no Node‑only APIs).
5. **Design quick and scalable endpoints** – use caching, pagination, indexing.
6. **Asynchronous data handling** – streaming for long operations, client‑side rendering when appropriate.
7. **API response documentation** – add comments describing response structure.
8. **Database integration with SSR** – use Neon + Drizzle.
9. **Maintain existing functionality** – when debugging, do not break existing endpoints.
10. **Comprehensive error handling and logging** – log with context (user ID, path, error message).
11. **Optimise for quick and easy use** – minimise loading animations, show data ASAP.
12. **Complete code verification** – check all imports, no dangling files.
13. **Use TypeScript** – strict mode, no `any`, proper type definitions.
14. **Ensure security and scalability** – auth, rate limits, input validation, secure headers.
15. **Include error checks and logging** – every `catch` block logs to `audit_trail` or server logs.
16. **Protect exposed endpoints** – `withApiAuth` + rate limits (Upstash/Redis).
17. **Secure database access** – **parameterized queries only** (Drizzle templates, no string concatenation).
18. **Step‑by‑step planning** – read, plan, cite file paths and line numbers, then implement.
19. **Utilise specified tech stack** – Next.js App Router, Neon, Drizzle, DaisyUI, Tailwind, Adumo Virtual.
20. **Consistent use of existing styles** – reuse `components/ui` components (Button, Card, etc.).
21. **Specify script/file for code changes** – always mention the exact file path.
22. **Organise UI components properly** – all under `/components`; no other component folders.
23. **Efficient communication** – one message per logical task; avoid back‑and‑forth.
24. **Read everything first** – Ground Truth Report before any change.
25. **Machine‑verifiable completion evidence** – provide `curl` commands, test outputs, migration checksums.
26. **Claim migration numbers** – from `docs/MIGRATION_MASTER.md` before creating new SQL.

---

## 3. The 16 Gotchas – Always Prevent

| # | Gotcha | Countermeasure |
|---|--------|----------------|
| 1 | Overconfidence in completion | Independent verification gate; machine evidence (e.g., `tsc --noEmit`, `grep -c TODO`). |
| 2 | Skipping initial code read | Mandatory Prompt 0 + Ground Truth Report. |
| 3 | Branch / migration collisions | Claim numbers in master list; CI rejects duplicates. |
| 4 | Design docs without code | Acceptance criteria: functional route, test, screenshot. Ban “plan complete” as deliverable. |
| 5 | Ignoring project conventions | Use glossary (PRD Appendix C); lint disallowed terms (e.g., “KISS” in UI). |
| 6 | Forgetting dependencies | Publish API contracts first (`/contracts/`); contract tests; merge order enforced. |
| 7 | Security as afterthought | Dedicated security agent (or CI gate) runs `npm run security:preflight`. |
| 8 | Placeholders in production | “No‑stub” lint rule; env validation script; zero tolerance for `your_` or `changeme`. |
| 9 | No end‑to‑end validation | Mandatory `curl` or Playwright smoke tests before merge. |
| 10 | Dead code and logs left behind | Pre‑commit hook blocks `console.log`; dead code audit in CI. |
| 11 | Contradictory status reports | Single source of truth: `PROJECT_STATE.md` (auto‑generated). |
| 12 | Assuming environment ready | Bootstrap verification script (`npm run verify:env`) checks all required vars and services. |
| 13 | Not cleaning up test artifacts | Transactional tests (rollback); dedicated test database; delete branches after merge. |
| 14 | Plan = Done fallacy | Never accept a plan as deliverable; require code, tests, and evidence. |
| 15 | Reinventing existing utilities | “Reuse before build” check; auto‑lint for raw `fetch` outside `lib/api-client.ts`. |
| 16 | No graceful degradation | Circuit breakers, exponential backoff, fallback messages (e.g., “Sofia is busy, try later”). |

---

## 4. Security Prompt Pack (Part 11 – Essential Gaps)

After every feature, run the **Master Security Review** (Gap 14):

```text
Check new code for:
1. Auth + authz on every endpoint (401/403).
2. No hardcoded secrets or API keys.
3. Backend validation (not just frontend).
4. Safe error messages – no stack traces, DB details.
5. Sanitised user content (XSS prevention).
6. Parameterised SQL only.
7. File uploads: type/size limits, magic bytes check.
8. Rate limiting on login, payment, partner invite.
9. CSRF protection on state‑changing operations.
10. Sensitive data not over‑exposed in API responses.
```

**Pre‑launch checklist (Gap 14 Pre‑Launch Prompt):**
- All secrets in environment variables, not code.
- All user input validated on backend.
- All database queries parameterised.
- All endpoints have auth + authz.
- Error messages generic.
- CORS locked to domain.
- Debug mode off.
- Cookies: `secure`, `httpOnly`, `sameSite`.
- HTTPS enforced.
- Rate limiting on login and sensitive endpoints.
- File uploads secure.
- Dependencies: no critical vulnerabilities.
- No test credentials/dummy data in production DB.

**Namibia PSD‑12 (Part 13) – If payments are involved:**
- **2FA on every payment initiation** (not just login).
- **≥99.9% availability** for critical systems.
- **RTO ≤2 hours**, **RPO ≤5 minutes** (backup & DR).
- **Biannual tabletop exercises**.
- **24h incident notification**, **30d impact report**.
- **Penetration testing every 3 years** for critical systems.

---

## 5. Frontend & UI (Part 9)

### 5.1 Public Marketing Pages
- Hero, feature sections, testimonials, final CTA.
- **Gated prices** – hidden until login.
- One primary CTA per page, repeated 3×.
- CTA button text **specific** (“Book Free Diagnostic”, not “Submit”).
- Navigation ≤5 items.

### 5.2 Authenticated App Pages
- Drawer (sidebar) + navbar + content.
- Loading/error/empty states.
- Use daisyUI components: `drawer`, `navbar`, `menu`, `table`, `tabs`, `modal`.

### 5.3 iOS Pill Buttons – Default
```html
<button class="btn btn-primary rounded-full px-6">Get Started</button>
```
- Always `rounded-full` + `px-6` (or `px-8`).

### 5.4 Component Selection (Quick Reference)
| Need | Use |
|------|-----|
| Key metrics | `stats` |
| Tabular data | `table` with `overflow-x-auto` |
| Card with image | `card` + `card-body` |
| Modal dialog | `<dialog>` + `modal` classes |
| Toast notification | `toast` + `alert` |
| Form validation | `input` + `validator` + `validator-hint` |
| Loading placeholder | `skeleton` |
| Collapsible section | `collapse` |

### 5.5 Accessibility Checklist
- Semantic HTML (`<button>`, `<a>`, `<nav>`, `<main>`).
- `alt` attributes on images; `aria-label` on icon‑only buttons.
- Keyboard navigable (Tab, Enter, Space); visible focus ring.
- Use `role="status"` or `aria-live="polite"` for dynamic content.

### 5.6 Performance
- Lazy load images (`loading="lazy"`).
- Use `next/image` for optimisation.
- Skeleton loaders for async data.
- Lighthouse score ≥90.

---

## 6. Database & Migrations (Part 2)

### 6.1 Modeling Rules
- **Underline nouns** → tables, **verbs** → relationships/statuses.
- **One‑to‑many:** foreign key on many side.
- **Many‑to‑many:** junction table.
- **Never store lists in a single column** – use separate table.
- **Split tables** when attributes diverge (e.g., `guest_profiles` vs `booking_charges`).

### 6.2 Migration Discipline
- **Forward‑only, idempotent** – use `IF NOT EXISTS`, `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$`.
- **Claim number** from `docs/MIGRATION_MASTER.md` before writing.
- **Never DROP** `audit_trail` or compliance tables.
- Apply migrations in order on production (Neon). Verify with `npm run test:db:migrations`.

### 6.3 RLS Policies
- Every table with `tenant_id` must have RLS enabled.
- Policy pattern:
  ```sql
  CREATE POLICY tenant_access_X ON X
  FOR ALL USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_type', true) = 'hub'
  );
  ```
- Hub users can see all rows; partners only their own.

### 6.4 Query Safety
- **Only parameterised queries** – use Drizzle `sql` template or Drizzle ORM.
- No string concatenation.

---

## 7. API Design (Part 3)

### 7.1 REST Conventions
- **Plural nouns** (`/api/bookings`, not `/api/getBookings`).
- **HTTP methods** – GET (read), POST (create), PATCH (partial update), DELETE.
- **Status codes** – 200, 201, 400, 401, 403, 404, 429, 500.
- **Pagination** – `?page=3&limit=10` or `?offset=20&limit=10`.
- **Versioning** – `/api/v1/…` (if needed).

### 7.2 Authentication & Authorisation
- **`withApiAuth`** middleware for all protected routes.
- **`requireTenantSessionUser`** for tenant‑scoped writes.
- **Guest APIs** (`/api/guest/*`) require role `guest` or `user` and email match.
- **Platform admin** – `isPlatformAdmin()` + email domain `@buffr.ai`.

### 7.3 Rate Limiting
- **Login**: 5 attempts / 15 minutes; lock account after 10.
- **Partner invite**: 5 / hour.
- **Public APIs**: 100 / minute / IP.
- **Payment initiate**: 20 / minute / user.
- Return `429` with `Retry-After` header.

### 7.4 Input Validation
- Use **Zod** schemas for every request body/query.
- Validate types, ranges, max lengths, enums.
- Reject invalid with `400` and a clear message.

### 7.5 Error Responses
- **No stack traces** in production.
- Generic user‑friendly message.
- Log full error server‑side (to `audit_trail` or server logs).

---

## 8. Testing Strategy (Part 14)

### 8.1 Test Pyramid
| Level | Share | Tools |
|-------|-------|-------|
| Unit | 60‑70% | Vitest |
| Integration | 15‑20% | Vitest + Testcontainers (Neon) |
| Contract | 5‑10% | Pact (if microservices) |
| E2E | 5‑10% | Playwright |
| Visual | On demand | Playwright screenshots |

### 8.2 Must‑Have Tests
- **Unit**: password validation, tax calculation, role helpers.
- **Integration**: API + real DB (transaction rollback). Test happy path + 401/403/400.
- **E2E**: Login → book → pay → check‑in → room service → settle → logout.
- **Smoke**: `npm run test:smoke` (DB health, fraud rules, key endpoints).

### 8.3 Test Data
- **Transactional rollback** for integration tests.
- **Ephemeral DB** in CI (Testcontainers).
- **No production data** – use factories (`Faker.js`).

### 8.4 Continuous Integration (CI) Gates
- **Pre‑commit**: lint, typecheck, block `console.log`.
- **PR**: `npm run test:ci` (unit + integration + smoke) → must pass.
- **Pre‑deploy**: `npm run security:preflight` + E2E smoke.

---

## 9. Git & Branching

- **`main`** – production (Vercel auto‑deploys).
- **`develop`** – integration.
- **Feature branches** – `feature/xxxx` or `agent-<task>`.
- **Migration numbers** – claimed from master list; branch name may include range.
- **Pre‑merge** – rebase, run all tests, update `PROJECT_STATE.md`.

---

## 10. Environment Variables

- **Local** – `.env.local` (never committed) with `localhost` URLs.
- **Production** – Vercel environment variables (set via `npm run env:push-vercel`).
- **Required** – `DATABASE_URL`, `NEXTAUTH_SECRET`, `HUB_TENANT_ID`, `DEFAULT_PROPERTY_ID`, `QDRANT_URL`, `QDRANT_API_KEY`, `ADUMO_*` (if payments).
- **No placeholders** allowed in production.

---

## 11. Final Workflow for Gemini

When given a task (e.g., “Fix bug X” or “Add feature Y”), you **must**:

1. **Read `PROJECT_STATE.md`** and any relevant source files.
2. **Run pre‑flight** (simulate the commands) and output Ground Truth Report.
3. **Plan** – list files to change, line numbers, and justification.
4. **Implement** – write code following the 26 rules and gotcha checklist.
5. **Verify** – run `tsc`, test, and provide evidence (`curl`, test output).
6. **Run the Master Security Review** on new code.
7. **Update `PROJECT_STATE.md`** and commit changes.

**Never** claim completion without machine‑verifiable evidence. **Never** skip reading the current state.

---

## Appendix: Quick Reference

| Area | Command / Check |
|------|----------------|
| TypeScript | `npx tsc --noEmit` |
| DB migrations | `npm run test:db:migrations` |
| All tests | `npm run test:ci` |
| Security preflight | `npm run security:preflight` |
| Playwright E2E | `npm run test:e2e:responsive` |
| Generate state | Run the Master Project State Discovery prompt (see `PROJECT_STATE.md`). |

> **Remember:** You are responsible for preventing the 16 gotchas. When in doubt, re‑read `PROJECT_STATE.md` and follow the Boy Scout Rule: leave the project cleaner than you found it.
```

This `gemini.md` is complete and can be given directly to Gemini as a system instruction or conversation context. It leaves nothing out – all principles, rules, gotchas, security prompts, and workflows are included.
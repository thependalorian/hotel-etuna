# Hotel Etuna — Task & Production Tracker

**Status:** **Production Live** — operator OS **foundation shipped**; several North Star journeys remain **partial** (see § Honest implementation status). `npm audit --audit-level=critical`: **0 critical**.  
**Last Updated:** May 18, 2026 (PRD v2.10.9; **DOMAINS_AND_PORTALS** v1.16.3; **GUEST-HUB-WIRE** + **GUEST-POST-STAY** shipped; schema/types audit — **no new migration** for post-stay; SQL **0000–0038** · `test:db:migrations` **77/77**; `tsc --noEmit` ✅; tree **`REPO_TREE.txt`** — 580 dirs · 1,263 files · **188** API routes · **105** tests; **`npm run build`** — prerender errors on some routes (`use` / `useContext` null during static export; see § Build note); lint **20 errors** / ~370 warnings — React Compiler)  
**Production URL:** https://www.hoteletuna.com (canonical; apex `https://hoteletuna.com` should redirect — Vercel Domains)

**Vision canon:** **PRD §1.0–1.6** (audit + goals), **§12A** (gap matrix), **§13A** (North Star phases). **PLANNING.md** § Strategic North Star. **Implementation boundaries:** **`DOMAINS_AND_PORTALS.md`** (domains, portals, Wave 0 file list §13.1, migrations 0021+ §15, wireframes §14).

---

## Honest implementation status (May 18, 2026)

**Rule:** **Shipped** = code + API + UI + migration in repo **and** operator can complete the journey without placeholders. **Partial** = foundation exists; gaps listed. **Not started** = no production path. **Out of scope** = explicit product decision.

| Area | Status | What works today | What is NOT done |
|------|--------|------------------|------------------|
| **P0 portals** | **Shipped** | Proxy, sidebar, guest folio (no cash self-settle), `/desk`, `/payments`, `/reports` | — |
| **PMS / desk** | **Partial** | `/desk` search, walk-in, amend, charges, check-in/out, referral validate | Autonomous agentic ops; full POS→folio everywhere |
| **Guest portal** | **Partial** | `/guest` stays, **stay hub 100%**, **post-stay invoice + rebook** (`GET …/invoice`, `/guest/book` prefill, checkout email links), room service, pre-arrival + service requests (`0030`), loyalty redeem, `POST /api/guest/bookings` + deposit | Digital key, Adumo staging smoke |
| **Payments** | **Partial** | NamQR desk, manual EFT, Adumo routes + UI, **manual** bank recon, platform invoice HTML/CSV export | Adumo **staging/live smoke** |
| **F&B print** | **Shipped** (board-only) | `/restaurant/tickets` live queue; auto **board-only** when no `FNB_PRINT_*` (no printer required) | Physical ESC/POS when you set `FNB_PRINT_MODE=tcp` + URLs |
| **HR (NS-2.1)** | **Partial** | Shifts UI, attendance clock/QR, payroll CSV export | Full payroll integration, mobile app |
| **HK (NS-2.2)** | **Partial** | `/housekeeping` board, photos, guest requests on board | Dedicated mobile HK app |
| **GL / RMS (NS-3)** | **Partial** | Post period to GL, journal CSV export, accounting summary + **dashboard `finance.glPosted`** when period posted | Booking count cards still booking-based (revenue NAD from GL when posted) |
| **CMS (NS-1.1)** | **Shipped** | `/cms/pages` block editor, `app/[slug]` publish | Not a drag-and-drop Webflow-class builder |
| **Platform admin (P4)** | **Partial** | Tenants, users, audit, compliance; analytics wired | Cross-tenant invoice admin (property UI has draft/issue/PDF/mark-paid) |
| **Sofia** | **Partial** | Staff `/ai` tools (read-only ops); guest/email/voice | No public Sofia; no charts; blocked billing/recon/GL post |
| **Fraud dashboard** | **Shipped** | `/fraud` + `GET /api/fraud/statistics` (tenant-scoped, real charts) | — |
| **OTA channel manager** | **Out of scope** | Manual `booking_source` tags only; no `/channels` routes in repo | No Booking.com/Airbnb API |

**Journeys (honest):** J-S1 Partial · J-S2 Partial · J-S3 Partial · J-S4 Partial · J-S5 Partial · J-S6 **Shipped** (kitchen board; TCP print optional) · J-S7 Shipped · J-S8 Partial · J-S9 Shipped · J-S10 Partial · J-G1 Partial (book + deposit path exists; staging Adumo pending) · J-G2 Partial · J-G3 Partial · J-G4 Partial · J-G5 Partial · J-G6 Partial.

---

## Executive summary — North Star audit (May 17, 2026)

**Verdict:** Production-capable **single-property OS** (one operator tenant, property `hotel-etuna`): PMS, folio, Adumo/NamQR/manual EFT, F&B POS, Sofia assist, Namibia-style reports. **Not yet** the full agentic Hotel OS (PRD §1.1).

| Layer | Verdict |
|-------|---------|
| Foundation (PMS) | **~70%** — `/desk`, bookings, folio, walk-in, amend; not autonomous ops |
| Guest experience (Sofia Portal) | **~55%** — folio, room service, pre-arrival, service requests, loyalty, direct book path; no wallet key / post-stay polish |
| Phase 2 ops (HR, HK) — NS-2 | **~50%** — shifts, attendance, payroll CSV, HK board + guest requests; not full mobile HR/HK apps |
| Phase 3 revenue/finance — NS-3 | **~70%** — GL post, RMS, manual bank recon; simplified in-app P&L on property dashboard |

**P0 — blocks operators:** ✅ Wave 0 complete (see § Portal quality backlog).

**Journeys:** See § Honest implementation status (no “all shipped” claims).

**Preserve (competitive baseline):** `booking_charges`/folio, payments desk, F&B→folio, DB public site, Sofia RAG, Buffr platform billing, compliance — **no partner dashboard** in NS (`DOMAINS_AND_PORTALS.md` §4).

**Recommended build order:** Portal P0 → **introducers** → NS-1.2 → NS-2.3 → NS-2.2 → NS-2.1 → NS-3 polish (RMS UX, GL reports, guest portal QA). **No OTA channel manager** (bookings tagged via `booking_source` only). Full matrix: **PRD §12A**, **§13A**.

**Neon apply (May 17):** Project `hotel-etuna` — **0026/0026b**, **0028/0028b**, **0030/0030b** via Neon MCP; **0037** fraud + loyalty catalog + introducer tier seeds. Verify: `npm run test:db:migrations`.

**Orchestration (May 17):** **`MIGRATION_MASTER_LIST.md`** (claims) · **`DOMAINS_AND_PORTALS.md` §19** (dispatch + API contracts) · branches `agent-<n>-<feature>`.

### 10-agent dispatch (reference)

| # | Domain | Branch | Migrations | Code | DB apply |
|---|--------|--------|------------|------|----------|
| **0** | Integration / Neon | `main` | `npm run db:reset` (0000–0038) | — | Run after CASCADE |
| **1** | Portal P0 | `agent-1-portal-p0` | — | ✅ | — |
| **2** | Smart Front Desk | `agent-2-desk` | 0021, 0022 | ✅ | Via reset / apply-operator |
| **3** | Visual CMS | `agent-3-cms` | 0029, 0029b | ✅ | Via reset |
| **4** | F&B print | `agent-4-fnb-print` | 0032, 0032b | ✅ | Via reset |
| **5** | Referral introducers | orchestrator | 0031, 0031b | ✅ | Via reset |
| **6** | Loyalty | `agent-6-loyalty` | 0033, 0033b, 0035, 0036, 0037 | ✅ | **0037** after seed |
| **7** | Corporate B2B | `agent-7-corporate` | 0034, 0034b | ✅ | Via reset |
| **8** | Housekeeping | `agent-8-housekeeping` | 0024 | ✅ | Via reset |
| **9** | HR lite | `agent-9-hr` | 0023 | ✅ | Via reset |
| **10** | Bank recon | `agent-10-bank-recon` | 0025 | ✅ | Via reset |

**DB gate (all agents):**

```bash
cd hotel-etuna
npm run db:reset
# → set ETUNA_TENANT_ID + ETUNA_PROPERTY_ID from output
npm run test:db:migrations
npm run test:ci
```

**Next ops:** Merge agent branches → `main`; Vercel env: `ETUNA_TENANT_ID`, `ETUNA_PROPERTY_ID`, `BANK_IMPORT_MAX_MB` (omit `FNB_PRINT_*` until you have hardware).

**Database (May 17):** ✅ `npm run db:reset` — 112 tables; includes **0026** RMS, **0028** GL, **0030** guest extras; `test:db:migrations` **77/77**. Copy `ETUNA_*` into `.env.local`.

---

## Implementation dispatch (IMP) — May 17, 2026

**Excluded:** OTA channel manager (`0027`), Booking.com/Airbnb APIs — manual `booking_source` only.

**Verification legend:** **Code** = service + API + UI + migration exist · **DB test** = integration test hits Neon · **Unit** = helpers/schemas only

| Agent | Scope | Code | DB test | Unit |
|-------|--------|:----:|:-------:|:----:|
| **IMP-PF4** | Platform analytics page + `PlatformAnalyticsService` | ✅ | `platform-analytics-service` integration | — |
| **IMP-POLISH** | NamQR stepper (`GuestNamQrPayPanel`), desk booking lookup, platform no double sidebar | ✅ | — | `namqr-guest-flow` |
| **IMP-FNB** | Kitchen board + `GET /api/restaurant/print-jobs` | ✅ | — | `fnb-kitchen-board` (utils) |
| **IMP-CORP** | `CorporateStatementService` + statement API/CSV | ✅ | `corporate-statement` integration | `corporate-statement` export |
| **IMP-DESK** | `booking_source` on walk-in + `parseMt940*` | ✅ | — | `booking-source`, `bank-statement-parser` |
| **IMP-INV** | `stock_alerts` + `/inventory/alerts` GET/PATCH | ✅ | `inventory-alerts` integration | — |
| **IMP-BANK** | `BankReconciliationService.importStatement` CSV (`0025`); manual match only | ✅ | `bank-csv-import` integration | `bank-statement-parser` |
| **IMP-BILL** | Platform invoice HTML/CSV export + fee schedule PATCH | ✅ | — | `platform-invoice-export` |
| **IMP-FNB-BOARD** | Board-only print when no `FNB_PRINT_*` | ✅ | — | `fnb-print-dispatch` |
| **NS-3.1 GL** | `GlPostingService.postPeriodToGl` → `journal_entries` | ✅ | `gl-post-period` integration | COA constants only |
| **NS-3.2 RMS** | `RateRecommendationService` + `/revenue` | ✅ | — | transitions + signals |
| **NS-3.4 Guest** | pre-arrival + service requests (`0030`) | ✅ | — | validation schemas |

**False-positive guard:** Do not mark **Shipped** without **Code** ✅ + operator-complete journey. F&B: **board-only** when no printer env (jobs `printed` on screen); TCP adapter only when `FNB_PRINT_MODE=tcp` + URLs.

**Remaining (honest — needs you / third parties):** Adumo staging/live card smoke; counsel sign-off; compliance evidence; manual QA. **Code-complete in repo:** platform billing (draft/issue/HTML·CSV export/mark-paid/fee schedule), F&B board-only (no printer), GL-backed accounting summary when period posted.

**No printer:** leave `FNB_PRINT_*` unset — kitchen uses `/restaurant/tickets` only. Set `FNB_PRINT_MODE=tcp` + URLs when hardware arrives.

---

## Portal frontend dispatch (PF1–PF4) — May 17, 2026

**Spec:** **`DOMAINS_AND_PORTALS.md`** §5.7–5.8, §19.9. **KISS:** one operator tenant, four portals (P1 public, P2 guest, P3 staff, P4 platform).

| Agent | Portal | Branch | Scope | Status |
|-------|--------|--------|-------|--------|
| **PF1** | P1 Public | `agent-pf1-public` | Nav, CMS link in sidebar, book widget + referral validate UX, `/partners` CTA | ✅ |
| **PF2** | P2 Guest | `agent-pf2-guest` | `GuestSubNav`, `/guest` hub summary, loyalty + corporate folio banners | ✅ |
| **PF3** | P3 Staff | `agent-pf3-staff` | Sidebar operator nav (`/desk` primary, hide `/properties`, CRM subnav only), staff pages default property | ✅ |
| **PF4** | P4 Platform | `agent-pf4-platform` | Platform admin nav guard; `/admin/platform/analytics` wired to `PlatformAnalyticsService` | ✅ |

---

## System design audit (May 17, 2026) — `SYSTEM_DESIGN_MASTER_GUIDE.md`

**Scope:** hotel-etuna repo vs guide Parts 1–6, 9 (Buffr lessons), 10 (security gaps 1–14).

| ID | Severity | Guide ref | Violation | Evidence | Fix agent |
|----|----------|-----------|-----------|----------|-----------|
| **SD-1** | ✅ **P0** | Gap 4 | Compliance routes unauthenticated (IDOR via `tenantId`) | Fixed: `withApiAuth` + `rejectClientTenantMismatch`; `compliance-api-auth.test.ts` | **A11** |
| **SD-2** | ~~**P0**~~ ✅ | Gap 4, §19.2 | **`POST /api/introducers/validate`** staff-only; public book widget cannot validate codes | Fixed: dual staff/public handler + `tests/unit/introducer-validate-public.test.ts` | **A12** |
| **SD-3** | ✅ **P1** | Gap 5 | Prod error/stack leakage | Fixed: `sanitizeErrorDetails` in `api-helpers`; 8 unit tests | **A13** |
| **SD-4** | ✅ **P1** | KISS | Hub naming vs operator OS | Fixed: `resolvePublicEtunaProperty`, seed/reset copy | **A14** |
| **SD-5** | ✅ **P2** | KISS | Staff APIs missing property default | Fixed: `resolveStaffPropertyId()` on 5 routes | **A14** |
| **SD-6** | ✅ **P2** | Gap 8 | Public validate rate limit | Fixed with SD-2 (20/min IP) | **A12** |
| **SD-7** | **P3** | Buffr DRY lesson | Duplicate route patterns (acceptable); prefer `api-helpers` for new routes | Ongoing Boy Scout | — |

**Passes:** Parameterized Drizzle/SQL (no `sql.unsafe` found); RLS on tenant tables; rate limiting on many staff routes; `debug/auth` gated by `NODE_ENV`; session via Stack Auth (not localStorage tokens).

**Remediation (shipped in workspace):** agents 11–14 — run `npm run test:ci` before merge.

**Remaining (Boy Scout):** SD-7 route DRY; migrate `resolveHubTenantId` call sites to `etuna-scope` directly; full hub string grep in docs/tests.

---

## Security implementation dispatch (SEC) — May 18, 2026

**Gate:** `npm run security:preflight` (**14/14**) · `npm run security:audit-api-coverage` (**0** legacy `getServerSession` in `app/api`) · integration suite below. **Full assessment:** § SEC-ASSESSMENT (May 18, 2026).

| Agent | Scope | Security | Validation |
|-------|--------|----------|------------|
| **SEC-CRON** | All `app/api/cron/*` use `errorResponse` / `sanitizeErrorDetails` (no prod leak) | Cron `Bearer CRON_SECRET` | `tests/unit/cron-uptime-monitor.test.ts` ✅ |
| **SEC-GUEST-HUB** | `GET /api/guest/stays/[bookingId]/hub` — `withApiAuth` + `assertStayAccess` + rate limit; **UI** SSR `getGuestStayHubForEmail` on `/guest/stays/[id]` | Guest IDOR blocked; one hub load vs 3+ client fetches | `tests/integration/guest-stay-hub.test.ts` ✅ |
| **SEC-DASHBOARD-GL** | `finance.glPosted` + `revenueNad` on `GET /api/dashboard/stats` | Tenant-scoped `withApiAuth` | `tests/integration/dashboard-stats-gl.test.ts` ✅ |
| **SEC-INTEGRATION** | Prior IMP paths (corp statement, GL post, inventory, bank CSV, compliance auth) | RLS + tenant mismatch | **13/13** integration tests ✅ (May 18) |

**Verified integration batch:**

```bash
npx vitest run tests/integration/inventory-alerts.test.ts tests/integration/gl-post-period.test.ts \
  tests/integration/corporate-statement.test.ts tests/integration/compliance-api-auth.test.ts \
  tests/integration/bank-csv-import.test.ts tests/integration/guest-stay-hub.test.ts \
  tests/integration/dashboard-stats-gl.test.ts tests/unit/cron-uptime-monitor.test.ts
```

**Still manual / third-party:** Adumo staging smoke; counsel sign-off; SOC2 evidence population.

### Additional Master Guide findings (comprehensive audit May 17)

**Additional security gaps identified (re-audit May 17, 2026):**
- **SD-8** ✅ (P1): No `console.log` in `app/api` — 2 `console.warn` only (payments/initiate, whatsapp webhook)
- **SD-9** (P2): 181 routes; many use `getServerSession` instead of `withApiAuth` — not unauthenticated; migrate to `withApiAuth` over time  
- **SD-10** (P2): 3 instances of `dangerouslySetInnerHTML` — verify sanitization
- **SD-11** ✅ (P2): HSTS in `vercel.json` + CSP/X-Frame in `proxy.ts`
- **SD-12** ✅ (P2): GDPR `POST /api/user/delete-account` + `AccountDeletionService`
- **SD-13** ✅ (P3): Structured security logging — `security-logger.ts`; `withApiAuth` → `logUnauthorizedAccess` / `logRateLimitExceeded`

**Architecture improvements per KISS/DRY/Boy Scout principles:**
- **SD-14** (P3): Migration rollback paths in `MIGRATION_MASTER_LIST.md` need runtime testing
- **SD-15** (P3): No caching strategy for read-heavy public endpoints (menu, properties)
- **SD-17** (P3): No API versioning (`/v1/`) — needed before external integrations
- **SD-18** (P3): Inconsistent error response formats across routes

**Additional remediation agents:**
- **A12-rate-limits**: Per-endpoint rate limiting (Upstash/express-rate-limit) on auth, file uploads, expensive LLM calls
- **A13-prod-errors**: Remove all console.log from APIs; standardize `{ success, data, error }` response format; sanitize errors per NODE_ENV
- **A14-security-headers**: Next.js middleware for HSTS/CSP/X-Frame; lock CORS to `hoteletuna.com`; GDPR delete endpoint
- **A15-audit-logging**: Structured security event logging (separate from PostHog product analytics)

**Pre-deployment security checklist (Master Guide Gap 14):**

Run this AI prompt before every `main` merge:
```
Deploying Hotel Etuna - Master Security Review:
✓ 1. Secrets in env vars only (no hardcoded keys)?
✓ 2. Backend validation on all user inputs?
✓ 3. Parameterized queries (no sql.unsafe)?
✓ 4. Auth + authZ on all protected routes (audit 88/170)?
✓ 5. Error messages sanitized (no stack traces in prod)?
✓ 6. CORS locked to hoteletuna.com (no wildcards)?
✓ 7. NODE_ENV=production in Vercel?
✓ 8. Cookies: secure, httpOnly, sameSite?
✓ 9. No http:// URLs in code (HTTPS only)?
✓ 10. Rate limits on login/reset/expensive ops?
✓ 11. File upload validation (MIME, size, storage)?
✓ 12. npm audit --audit-level=critical returns 0?
✓ 13. No TODO/FIXME/test credentials in prod code?
```

**Strengths (passes Master Guide):**
- ✅ Drizzle ORM (parameterized, no SQL injection risk)
- ✅ RLS policies on all tenant tables
- ✅ Stack Auth server-side sessions (not localStorage)
- ✅ Neon TLS + Vercel secure connections
- ✅ Full TypeScript type safety
- ✅ Debug endpoints gated by NODE_ENV

**Security pre-flight (May 17, 2026):** `npm run security:preflight` — **12/12 pass**, 0 critical npm audit; evidence: `compliance/evidence/security/preflight-2026-05-17.json`. Re-run before each `main` merge.

**Next:**  
Boy Scout: expand `withApiAuth` coverage beyond **119/183**; close SEC-ZT gaps (device trust, org IdP MFA) — see § SEC-ZT dispatch below.

---

## SEC-ZT dispatch (May 18, 2026)

**Cross-ref:** Route hardening proofs — § Security implementation dispatch (SEC) above (cron sanitization, guest hub IDOR, dashboard GL). **NIST pillar map:** **`PLANNING.md`** § Zero Trust posture · portal lens **`DOMAINS_AND_PORTALS.md`** §4.3.1.

**At a glance — implemented vs gaps**

| Shipped in repo | Not Zero Trust complete |
|-----------------|-------------------------|
| **2FA API** (payments) | **Device trust** (no MDM / posture) |
| **Staff gate** (`proxy.ts` + RBAC) | **mTLS** (no BoN / bank mesh) |
| **PF-13** audit & security logging | **Org IdP MFA** (workforce-wide) |
| **Public route audit** (`security:audit-api-coverage`) | **SOC 2 sign-off** (CPA / exec signatures) |

**Honest verdict:** Application-layer controls are **strong for a single-property Vercel monolith** (session auth, RBAC, RLS, payment 2FA, static release gates). **Not** a full Zero Trust program.

| Area | Status | What exists in repo | What is NOT done |
|------|--------|---------------------|------------------|
| **2FA API** | **Shipped (payments)** | `TwoFactorAuthService` (`lib/services/security/TwoFactorAuthService.ts`); `require2FA` / `require2FAForPayment` (`lib/middleware/require2FA.ts`); `POST /api/payments/initiate`; `POST /api/compliance/psd/payment-security` (Zod + methods); proxy enforces `x-2fa-verified` on `/api/payments/initiate` | Org-wide MFA for every staff login (Stack Auth / NextAuth) — see gaps |
| **Staff gate** | **Shipped** | `proxy.ts` — `PUBLIC_ROUTES` first, then `PROPERTY_OWNER_ROUTES` / `hasRouteAccess()`; `lib/auth/roles.ts` (`isStaffRole`, platform vs guest redirects); staff/finance APIs on `withApiAuth` + role options | Fine-grained department scoping (HK vs F&B only) — partial |
| **PF-13 (audit & logging)** | **Shipped (app layer)** | Security Prompt Pack **§13**: `lib/utils/security-logger.ts` (401/403, rate limits); `lib/compliance/record-audit.ts`; failed login → `logAuthCredentialFailure`; preflight **PF-15**; SQL **`0038`** append-only `audit_trail` + `npm run compliance:verify-audit-trail` | Centralized SIEM / 365d Vercel log drain to evidence (optional — `VERCEL_LOG_EXPORT.md`) |
| **Public route audit** | **Shipped (tooling)** | `npm run security:audit-api-coverage` → `compliance/evidence/security/api-coverage-*.json` — **0** legacy `getServerSession` in `app/api`; **119/183** routes on `withApiAuth` (May 18); `proxy.ts` `PUBLIC_ROUTES` reviewed with P1 book + introducer validate | Manual §14 Master Review on every feature; not all **64** “other” API files are intentionally public-documented |

**Gaps (do not claim Zero Trust complete):**

| Gap | Why it matters | Track in |
|-----|----------------|----------|
| **Device trust** | No managed-device enrollment, posture checks, or cert-bound sessions | Fraud heuristics only (`FraudDetectionService` device score) — not ZT device pillar |
| **mTLS** | No mutual TLS for BoN / bank APIs or internal service mesh | **TASK.md** § Compliance — BoN open banking; `lib/services/openbanking/` stub |
| **Org IdP MFA** | Payment 2FA ≠ workforce MFA on all privileged accounts | SOC 2 CC6.3; Stack Auth / IdP policy — **not** enforced app-wide |
| **SOC 2 sign-off** | Policies drafted; no executive signatures or CPA Type I/II report | **TASK.md** § High Priority — SOC 2 Compliance Initiative; `compliance/evidence/policies/` empty |

**Release gates (unchanged — run before `main` merge):**

```bash
npm run security:preflight              # 12/12 static (PF-01 … PF-15 + PF-12 audit)
npm run security:audit-api-coverage       # 0 legacy session routes
npm run test:db:rls                       # tenant isolation
```

---

## GUEST-HUB-WIRE dispatch (May 18, 2026) — **100% complete**

**Goal:** Single hub load for `/guest/stays/[id]` with SSR + unified refresh after mutations.

| Item | Status | Evidence |
|------|--------|----------|
| Shared loader | **Shipped** | `lib/services/guest/GuestStayHubService.ts` — booking, folio, pre-arrival, requests, loyalty, **menu** |
| API route DRY | **Shipped** | `GET /api/guest/stays/[bookingId]/hub` |
| SSR + client shell | **Shipped** | `page.tsx` → `GuestStayDetailClient` + `GuestStayHubProvider` |
| Hub summary UI | **Shipped** | `GuestStayHubSummary.tsx` |
| Client refresh | **Shipped** | `lib/guest/fetch-guest-stay-hub.ts`; `refreshHub()` after pre-arrival save, service request, room order, NamQR, loyalty redeem |
| Menu in hub | **Shipped** | `GuestStayMenuPayload` in hub; folio panel no separate `/menu` fetch on stay page |
| Tests | **Shipped** | `tests/integration/guest-stay-hub.test.ts` (active + **checked-out post-stay** + invoice HTML) · `tests/unit/fetch-guest-stay-hub.test.ts` |

**Out of scope (guest portal North Star):** digital key, Adumo staging smoke. **Post-stay invoice/rebook:** see § GUEST-POST-STAY dispatch below.

---

## GUEST-POST-STAY dispatch (May 18, 2026) — **Shipped**

| Item | Evidence |
|------|----------|
| Printable folio invoice | `GET /api/guest/stays/[bookingId]/invoice?format=html` · `lib/services/guest/guestStayInvoiceExport.ts` |
| Rebook | `lib/guest/rebook-url.ts` → `/guest/book?propertyId&checkInDate&checkOutDate` |
| Hub + UI | `hub.postStay` · `GuestPostStayPanel` · past-stay cards on `/guest` |
| Checkout email | `bookingLifecycleSideEffects` — invoice + rebook links in thank-you email |
| Tests | `tests/unit/guest-post-stay.test.ts` (5/5) · hub integration asserts `postStay` + invoice HTML on `checked_out` |
| Schema | **No new migration** — uses `bookings`, `booking_charges` (**0009**), `guest_pre_arrival` / `guest_service_requests` (**0030**); types in `lib/types/folio.ts`, `guest-portal-types.ts`, `GuestStayHubService` |

---

## Schema & types verification (May 18, 2026)

| Check | Command / artifact | Result |
|-------|-------------------|--------|
| SQL chain | `scripts/db/reset-database.ts` · `database/drizzle/*.sql` (**48** files; **0027** OTA excluded) | **0000–0038** |
| Neon verify | `npm run test:db:migrations` | **77/77** · **112** tables |
| ORM mirror | `lib/db/schema.ts` | Matches applied DDL |
| TypeScript | `npx tsc --noEmit` | ✅ |
| Guest hub types | `GuestStayHubPayload` · `GuestPostStayMeta` · `GuestStayMenuItem` | Hub + invoice + rebook |
| Optional ops SQL | `operator_enable_pgaudit.sql` | Not in reset chain |

**Post-stay / hub / invoice / staff 2FA:** application-layer only — **do not** add a migration unless new columns are required.

### Build note (May 18)

`npm run build` may fail during static prerender (`TypeError: Cannot read properties of null (reading 'use')` on pages such as `/payments/desk`, `/dining`). **`tsc --noEmit`** and guest integration tests pass. Mitigation in progress: `force-dynamic` on legacy redirects (`/payments/chargebacks`) and DB-backed public pages (`/dining`). Root cause likely React 19 / Next 16 static export + client providers — track separately from guest hub work.

---

## North Star roadmap (PRD §13A) — shipped + polish

Waves **0–2c** foundations are in repo + Neon. **NS checkboxes below = foundation delivered**, not full PRD North Star (see § Honest implementation status). Remaining: Adumo smoke, platform billing PDFs, GL-backed property P&L, journey polish, QA.

### NS-1 Foundation & core OS

- [x] **NS-1.1** Integrated visual CMS — `0029` + `/cms/pages` block editor + `app/[slug]` publish (Agent 3, `agent-3-cms`)
- [x] **NS-1.2** Agentic staff workspace — `/desk`: search, walk-in, amend room, post charge, check-in/out, referral validate (Wave 1a **0021–0022**)
- [x] **NS-1.2b** Portal hardening — Wave 0 P0 (proxy, sidebar, guest profile/folio)

### NS-2 Internal efficiency

- [x] **NS-2.1** Lite HR — **Shipped (Agent 9, `agent-9-hr`)** — migration `0023_staff_attendance.sql`; `/staff/shifts` drag-drop planner; QR + manual `POST /api/staff/attendance/clock`; payroll CSV `GET /api/staff/payroll/export`; Vitest `payroll-csv-export.test.ts`
- [x] **NS-2.2** Housekeeping & maintenance mobile — `/housekeeping` board, `hk_tasks` + photos, checkout → dirty + auto task, Vitest transitions (Agent 8 / 0024)
- [x] **NS-2.3** Payment reconciliation — **Manual** (May 2026): cash tab at `/payments/reconciliation`; bank tab = CSV/MT940 import for reference + **manual match** only (`BANK_RECON_MANUAL_MATCH_ONLY`); no auto-match on import; no NamClear / external bank APIs (Adumo only for card payments).

### NS-3 Revenue & financial control

- [x] **NS-3.1** USALI financial back office — `0028` GL tables + `GlPostingService`; **Post period to GL** on `/reports/accounting`; COA seeded from `namibia-hospitality-coa`
- [x] **NS-3.2** Agentic RMS (foundation) — `0026` + `RateRecommendationService`; `/revenue`; rule-based BAR from occupancy
- [x] **NS-3.2b** RMS depth — Sofia tools + event/holiday signals (not occupancy-only); see agent dispatch
- [x] **NS-3.3** ~~Two-way channel manager~~ — **Removed / out of scope** (May 2026). No Booking.com/Airbnb API. Staff set `booking_source` on create (`ota_booking_com`, `ota_airbnb`) for reporting only.
- [x] **NS-3.4** Guest pre-arrival + service requests — migration `0030`/`0030b`, guest APIs, P2 `/guest` + stay detail, P3 booking detail, Vitest
- [x] **NS-3 Neon** — `0026`, `0028`, `0030` (+ RLS) applied on production Neon; `0037` OS seeds; `npm run test:db:migrations` **77/77**
- [x] **Sofia staff tools** — `lib/services/ai/sofia-tools/` (analytics, RMS, GL read-only, HK, inventory, folio, CRM, guest portal); public `PublicSofiaChat` removed; Vitest `sofia-staff-tools.test.ts`
- [x] **NS-POLISH** — `/revenue` `RateApprovalPanel` signals column + empty state; `/reports/accounting` posted GL list + journal CSV export (`GlPostingService.exportPostedJournalEntriesCsv`); Sofia GL remains read-only

### OTA channel manager — removed (May 2026)

**Decision:** No Booking.com / Airbnb API, no `/channels`, no `0027` migrations. OTA stays are tagged manually via `bookings.booking_source` (`ota_booking_com`, `ota_airbnb`) for analytics only.

**Code cleanup (May 18):** Removed `app/(dashboard)/channels/`, `app/api/channels/*`, `lib/services/channels/`, `lib/services/kiss/`, `components/features/channels/`, and empty stub API dirs (`logout`, `3ds-callback`, `payments/complete`, `staff/schedules`, `staff/performance`, `bon/v1/banking`). See **`DOMAINS_AND_PORTALS.md` §13.0**.

**If Neon already has `ota_*` tables:** run once: `DROP TABLE IF EXISTS ota_reservation_imports, ota_room_mappings, ota_connections CASCADE; DROP TYPE IF EXISTS ota_import_status, ota_channel;`

---

## Portal quality backlog (May 2026 audit)

**Spec:** Full cleared-portal targets and `proxy.ts` allowlist — **`DOMAINS_AND_PORTALS.md`** §5.

**P0 — blocks operators/guests on first login**

- [x] `proxy.ts`: allow `/payments` and `/reports` for `owner` / `manager` / `staff`
- [x] Sidebar: Guest CRM → `/crm` (not `/crm/guests`); Rooms → `/dashboard/rooms` (not public `/rooms`)
- [x] `/crm/guests` index → redirect `/crm`
- [x] `/bookings`: single property via `resolveEtunaProperty()` (no multi-property selector)
- [x] `lib/auth/roles.ts`: distinguish hotel `admin` from Buffr platform admin redirect (`@buffr.ai` + `is_platform_admin`)
- [x] Guest folio: remove **Pay cash** self-settle (card + NamQR only)
- [x] Guest `/profile` under guest layout (`/guest/profile`; staff `/profile` redirects guests)

**PF3 — P3 Staff portal (DOMAINS §5.2, §5.7)**

- [x] Sidebar: **Command center** → `/desk` first; **Overview** → `/dashboard` secondary
- [x] Sidebar: hide **Properties** for operator roles (Buffr platform admin only via `shouldRouteToPlatformConsole`)
- [x] Sidebar: single **Guest CRM** → `/crm`; Introducers/Corporate via `CrmSubNav` only
- [x] Sidebar: **Website CMS** → `/cms/pages` (Loyalty via `CrmSubNav` only)
- [x] `/staff/shifts`: default `propertyId` via `resolveEtunaPropertyId()` when query empty
- [x] `/crm`: `CrmSubNav` on dashboard (Introducers, Corporate, Loyalty tabs)
- [x] `proxy.ts`: `/cms` in `PROPERTY_OWNER_ROUTES` for staff roles
- [x] `proxy.ts`: `/inventory` in `PROPERTY_OWNER_ROUTES` (Sidebar → Inventory alerts)
- [x] `proxy.ts`: `/offline` in `PUBLIC_ROUTES` (PWA shell)

**P1 — Guest loyalty (D12)**

Spec: **`DOMAINS_AND_PORTALS.md`** §10.5. Branch: `agent-6-loyalty`. Migrations: `0033`, `0033b`, `0035`.

- [x] `loyalty_transactions` migration (`0033`) + staff ledger UI (`/crm/loyalty`)
- [x] Redemption catalog (`0035`) + guest `/guest/loyalty` + `GET /api/guest/loyalty/catalog`
- [x] `POST /api/guest/loyalty/redeem` — `redemptionType` + `itemId` (catalog) or `pointsToRedeem` (legacy)
- [x] Auto tier upgrade (bronze → platinum) via `resolveLoyaltyTier` on earn/redeem/adjust
- [x] Staff manual adjust — `POST /api/crm/loyalty/adjust` + `CrmSubNav`
- [x] Analytics: points liability + repeat-booking KPI

**P1 — Corporate B2B (D2/D11) — Wave 1e / Agent 7**

Spec: **`DOMAINS_AND_PORTALS.md`** §3.1, §15.8. Branch: `agent-7-corporate`.

- [x] Migrations `0034_corporate_accounts.sql` + `0034b_corporate_accounts_rls.sql` (atomic pair)
- [x] `lib/db/schema.ts` — `corporate_accounts`, `corporate_contacts`, `booking_guests`, booking bill-to columns
- [x] `CorporateAccountService` — CRUD, credit check, booker authorization
- [x] `BookingService.createBooking` — `billingParty`, `corporateAccountId`, `bookerGuestId`, rooming list
- [x] `FolioService.settleFolio` — corporate AR branch; guest self-settle blocked
- [x] Staff UI `/crm/corporate` + APIs `/api/corporate/accounts`
- [x] Guest folio — corporate billed banner; no card/NamQR when company bill-to (J-C1)
- [x] Desk `/desk` walk-in — corporate account selector, booker, `billing_party=corporate_account` (J-S9)
- [x] Vitest — `tests/unit/corporate-billing.test.ts`, `tests/unit/desk-corporate-walk-in.test.ts`, `tests/integration/corporate-folio.test.ts`
- [x] Apply `0034` + `0034b` via `npm run db:reset` or `apply-operator-sql.ts --files 0034,0034b`

**P1 — Referral introducers (D14) — introducers & discount tiers**

Spec: **`DOMAINS_AND_PORTALS.md`** §10.5, wireframe §14.6. Services exist: `lib/services/introducers/`, `0031_introducer_partners_tiers.sql`.

- [x] Apply migrations `0031` + `0031b` on Neon (`npx tsx scripts/db/apply-operator-sql.ts`)
- [x] Sync `lib/db/schema.ts` with §15 drift register (introducer tables + booking FKs)
- [x] Staff UI: `(dashboard)/crm/introducers` — CRUD introducers, tier assign, code rotate
- [x] `POST /api/introducers/validate` — §19.2 contract (desk + P1 book)
- [x] Booking desk (`/desk`): referral code field → `POST /api/introducers/validate` + walk-in (`agent-2-desk`)
- [x] Public book widget: referral code field → validate API + `IntroducerDiscountService`
- [x] **J-G1 Wave 5** — signed-in direct book E2E: `LandingBookingWidget` → `/guest/book` → `POST /api/guest/bookings` (`booking_source=direct`) → `/guest/stays/[id]` deposit (Adumo `BookingDepositPayCard`)
- [x] `AnalyticsService.getIntroducerAttributionMetrics` on reports dashboard
- [x] Wire `hospitalityMarketingWorkflows` segment `introducer_referred` into CRM outreach (consent-gated)

**P1 — trust & polish**

- [x] NamQR guest flow: stepper; require QR before notify; dining copy vs room-service reality
- [x] Payments desk: find booking by reference; NamQR pending badge on dashboard
- [x] Platform admin: dedicated layout (no double sidebar)
- [x] Platform admin: wire `/admin/platform/analytics` — `PlatformAnalyticsService` + `PlatformAnalytics` UI (no “coming soon” placeholder)
- [x] Email-verify UX on login + guest APIs (403 → actionable copy)

---

## DNS & environment URLs (May 17, 2026)

**Full reference:** `docs/project/PLANNING.md` § DNS, domains & environment URLs.

| Check | Status / action |
|-------|----------------|
| Vercel project | `buffr/hotel-etuna` → **Settings → Domains** |
| `www.hoteletuna.com` | `CNAME` → `cname.vercel-dns.com` |
| `hoteletuna.com` (apex) | `A` `76.76.21.21` or apex `CNAME` per Vercel docs |
| SSL | Vercel auto after DNS valid |
| `.env.local` uses `localhost` | ✅ **Expected** for local dev only |
| Production URL env on Vercel | `npm run env:push-vercel` → sets `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `ADUMO_*` to `https://www.hoteletuna.com` |
| Adumo portal | `…/payment/success`, `…/payment/failed`, `…/api/webhooks/adumo` on **www** (see PLANNING § webhooks table) |
| Meta WhatsApp | Callback `https://www.hoteletuna.com/api/webhooks/whatsapp` + `WHATSAPP_VERIFY_TOKEN` |
| Sofia voice (if on) | `https://www.hoteletuna.com/api/sofia/voice/webhook` in provider dashboard |
| PostHog | `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` on Vercel + local |

**Verify after DNS change:**

```bash
dig www.hoteletuna.com +short
dig hoteletuna.com +short
curl -sI https://www.hoteletuna.com | head -5
```

---

## Legacy inventory & cleanup (May 17, 2026)

**Payments (May 17):** Removed Stripe env block, `AdumoEnterpriseService`, `/api/payments/3ds-callback`, `/api/payments/complete`. **Namibia card rail = Adumo Virtual only** (form POST → `initialisevirtual`, redirects, JWT webhook).

| Category | Item | Action |
|----------|------|--------|
| **Compat routes** | `/privacy`, `/terms` → `/legal/*` | Keep |
| **Compat API** | `/api/guests` → CRM | Keep until migrated |
| **Compat RBAC** | Role `user` = `guest` | Keep |
| **UI unused** | `MenuPageTurner.tsx` | **P2:** extract types, delete component |
| **UI backup** | `page-static-backup.tsx` | **P2:** delete if unneeded |
| **Infra** | Docker `legacy-pg` | Keep for local dev |
| **Tech debt** | `getServerSession` vs `withApiAuth` | Migrate over time |

**Adumo Virtual (production):** `ADUMO_*` + portal URLs on `https://www.hoteletuna.com` — success/fail redirects + `POST /api/webhooks/adumo`. Test cards: Visa `4000000000001091` (3DS app `23ADADC0-…`).

---

## CI/CD & production gates (May 17, 2026)

| Workflow | Trigger | What it runs |
|----------|---------|----------------|
| **`.github/workflows/ci.yml`** | Push/PR → `main`, `develop` | ESLint → `tsc` → **`npm run test:ci`** → `npm run build` |
| **`.github/workflows/deploy.yml`** | After **CI** succeeds on `main`, or manual | `vercel build` + `vercel deploy --prebuilt --prod` (needs `VERCEL_*` secrets) |
| **`.github/workflows/security-audit.yml`** | Weekly + push `main` | `security:preflight`, `npm audit` |
| **`.github/workflows/database-migration.yml`** | Schema/migration path changes | `db:generate` + git diff on `database/drizzle/` |
| **`.github/workflows/cron-verification.yml`** | Schedule | Cron route checks |
| **`.github/workflows/soc2-evidence.yml`** | Schedule / manual | SOC2 evidence collection |

**Local commands (match CI):**

```bash
npm run test:ci          # test:db + test:db:migrations + vitest + smoke
npm run verify:production # tsc + test:ci + next build
npm run test:all         # same as test:ci (alias intent; use test:ci in CI)
```

**Vercel:** Project `buffr/hotel-etuna` connected to `github.com/thependalorian/hotel-etuna` — pushes to `main` trigger production builds. CLI deploy: `vercel deploy --prod --yes`. **Secrets:** `npm run env:push-vercel` (from `.env.local`; sets production `ADUMO_*` redirect/webhook URLs). **DB:** `npm run test:db:migrations` — includes `0018` `dining_reservations`, `0019` Adumo dining link.

---

## Analytics, responsive UI & E2E (May 17, 2026)

### PostHog (product analytics)

| Item | Path / version | Notes |
|------|----------------|-------|
| Browser SDK | `posthog-js` **^1.373.5** (dependency) | PostHog MCP SDK doctor: healthy on project **341765** |
| React bindings | `@posthog/react` **^1.9.0** | `PostHogProvider` wraps app in `app/layout.tsx` |
| Early init | `instrumentation-client.ts` | Next.js 16 client instrumentation |
| Shared options | `lib/posthog-client-options.ts` | `defaults: '2026-01-30'` → SPA `history_change` pageviews |
| Client helpers | `lib/posthog.ts` | `trackEvent`, `identifyUser`, feature flags |
| Server capture | `lib/monitoring/posthog-server.ts` | `captureServerException` (API routes) |
| Env | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Optional `POSTHOG_PROJECT_API_KEY` for server |

Docs: [Next.js library](https://posthog.com/docs/libraries/next-js) · [SPA pageviews](https://posthog.com/tutorials/single-page-app-pageviews)

### Playwright (E2E)

| Item | Detail |
|------|--------|
| Package | `@playwright/test` **^1.60.0** |
| Viewport projects | `chromium`, `mobile-chrome` (Pixel 5), `tablet` (iPad gen 7) — `playwright.config.ts` |
| Specs | **8** files under `e2e/` (incl. `responsive-layout.spec.ts`) |
| Scripts | `test:e2e`, `test:e2e:desktop`, `test:e2e:mobile`, `test:e2e:tablet`, `test:e2e:responsive`, `test:e2e:install:all` |

`responsive-layout.spec.ts`: horizontal overflow on `/`, `/rooms`, `/dining`, `/contact`; mobile nav toggle (mobile project).

### Test run (May 17, 2026 — after PostHog/Playwright update)

| Step | Command | Result |
|------|---------|--------|
| DB health | `npm run test:db` | ✅ pass |
| Migrations | `npm run test:db:migrations` | ✅ **21/21** |
| Unit + integration | `npm test` (`vitest run`) | ✅ **427 passed**, 2 skipped (workflow YAML tests fixed) |
| Compliance smoke | `npm run test:smoke` | ✅ **6/6** |
| PostHog unit | `npx vitest run tests/unit/posthog-analytics.test.ts` | ✅ **4/4** |
| Workflow YAML tests | `npx vitest run tests/workflows/` | ✅ **78/78** |
| Full CI gate | `npm run test:ci` | ✅ `test:db` + migrations + Vitest + smoke (run locally ~15 min) |

**Workflow tests (May 17):** `ci-workflow.test.ts` + `deploy-workflow.test.ts` aligned to `ci.yml` (`NODE_VERSION`, `needs: [lint-and-typecheck, test]`, `test:ci`, Codecov step) and `deploy.yml` (`workflow_run` after CI on `main`, current step names). `.vercel/project.json` assertions optional when not linked locally.

**Playwright E2E:** not run in this gate (requires dev server on `:3010` or `PLAYWRIGHT_BASE_URL`). Operator: `npm run test:e2e:responsive` after `npm run dev -- -p 3010`.

**Project tree (regenerate):**

```bash
tree -I 'node_modules|.next|.git|coverage|playwright-report|test-results' -L 3 --dirsfirst -F --charset ascii
# May 17, 2026: 229 directories, 351 files — full map in PRD §4.6 (+ depth-4 guest/ platform)
```

**New unit tests (guest/auth):** `tests/unit/auth-roles.test.ts`, `password-validation.test.ts`, `public-session-nav.test.ts`, `public-rate.test.ts`, `stack-env.test.ts`.

---

## Compliance & regulatory verification (May 17, 2026)

**PRD §3.7** · **Docs:** `docs/compliance/README.md`, `NAMIBIA_REGULATORY_FRAMEWORK.md`, `AML_FICA_COMPLIANCE_PROGRAM.md`, `INCIDENT_RESPONSE_PLAN.md`, `docs/SECURITY_PROMPT_PACK.md`, `docs/project/SOC2_IMPLEMENTATION_PLAN.md` · **BoN corpus:** `mba-agent/documents/mba-agent/regulatory/namibia/` (PRD Appendix F).

### Pre-release (payments / compliance)

- [ ] Counsel confirms **merchant + SaaS** posture (not unlicensed PSP / e-money)
- [ ] Guest Adumo settlement → **Etuna Nedbank** (`lib/platform/settlement-accounts.ts`)
- [x] `npm run security:preflight` — **12/12 pass**, 0 critical npm audit (May 17, 2026 → `compliance/evidence/security/preflight-2026-05-17.json`)
- [ ] Security Prompt Pack **§14** Master Review (manual) on release branch
- [x] `npm run test:db:migrations` — **18/18** (incl. `0016` fraud rules + `0017` ai_conversations index; May 17, 2026)
- [ ] `npm run test:ci` — full gate before production deploy (~15 min)
- [ ] NamQR desk smoke: generate + confirm on staging
- [ ] Review gap register **G-01–G-09** (`NAMIBIA_REGULATORY_FRAMEWORK.md` §6)

### Code hygiene — DRY & Boy Scout (hotel-etuna, May 17, 2026)

| Item | Path / action | Status |
|------|----------------|--------|
| Sofia single pipeline | `lib/services/ai/sofia-concierge-handler.ts` | ✅ |
| SOC2 orchestrator | `lib/compliance/soc2/Soc2AuditOrchestrator.ts` | ✅ |
| SOC2 catalog DRY | `nayaone-tsc-framework.ts` + `control-matrix.ts`; `control-catalog.ts` re-export | ✅ |
| Tenant session helper | `requireTenantSessionUser` — settings, analytics, dashboard/activity, profile | ✅ |
| Fraud tenant rules | `tenant-fraud-rules.ts` + migration `0016` | ✅ |
| AI session index | `database/drizzle/0017_ai_conversations_tenant_session_idx.sql` | ✅ applied Neon May 17 |
| Duplicate `getSessionUser` in API routes | grep `app/api` | ✅ none remaining |

### Validation (DRY / Boy Scout — May 17, 2026)

| Step | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ pass |
| `npx vitest run tests/unit/soc2-audit.test.ts tests/unit/soc2-control-matrix.test.ts tests/unit/soc2-audit-agents.test.ts` | ✅ 11/11 |
| `npm run test:db:migrations` | ✅ **18/18** (incl. `0017` idx_ai_conversations_tenant_session) |

### Engineering backlog (from regulatory review)

- [x] **Fraud:** `lib/services/fraud/tenant-fraud-rules.ts` — `0016` rules on `PsdPaymentFraudGate` + `FraudDetectionService.evaluateRule`; tests `tests/unit/tenant-fraud-rules.test.ts`
- [x] **Fail-closed:** `PsdFraudGate` blocks in production (or `FRAUD_GATE_FAIL_CLOSED=true`); dev → manual review
- [ ] **Fraud (P2):** Add CNP / EFT-confirm rules from `nps_fraud_trend_report_10_years.md` to seed + admin UI
- [ ] **G-04:** BoN incident API when credentials available
- [ ] **G-05:** FIC STR export / goAML integration
- [ ] **G-01 / G-06:** DSAR portal + cookie consent banner
- [x] **G-08 (drafts):** 21 SOC 2 policies in `docs/compliance/policies/` (May 17, 2026)
- [ ] **G-08 (sign-off):** Executive signatures → `compliance/evidence/policies/`
- [ ] **G-09:** Vendor SOC 2 / PCI attestations (Vercel, Neon, Adumo)
- [ ] **SOC 2 evidence:** Populate `compliance/evidence/`; run tabletop IR; align BCP RTO/RPO with SOC2 plan

### Validation (fraud unification — May 17, 2026)

| Step | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ pass |
| `npx vitest run tests/unit/tenant-fraud-rules.test.ts` | ✅ 4/4 |
| `npm run test:db:migrations` | ✅ 18/18 |
| `npm run security:preflight` | ✅ 12/12 → `compliance/evidence/security/preflight-2026-05-17.json` |

### Automated checks

| Check | Command |
|-------|---------|
| DB + migrations 0011–0017 | `npm run test:db:migrations` |
| Compliance fraud smoke | `npm run test:smoke` |
| SOC 2 agents (local) | `npx tsx scripts/soc2/collect-evidence.ts` |
| SOC 2 workflow | `.github/workflows/soc2-evidence.yml` |
| Security audit workflow | `.github/workflows/security-audit.yml` |

---

## Verified Implementation Audit (May 16, 2026)

**Method:** Repo inspection + commands (not agent markdown alone). Canonical record lives here; PRD §12 and PLANNING § Verified Audit mirror this table.

| Check | Command / evidence | Result |
|-------|-------------------|--------|
| TypeScript | `npx tsc --noEmit` | ✅ Exit 0 |
| RLS isolation | `npx tsx scripts/db/verify-tenant-rls.ts` | ✅ All checks passed |
| DB baseline | `npm run test:db` | ✅ `scripts/db/verify-db.ts` — health, baseline tables, fraud rule count |
| Operator SQL 0011–0037 | `npm run test:db:migrations` | ✅ **77/77** on Neon (May 17; incl. **0026/0028/0030** RLS, **0037** fraud seeds) |
| Full automated gate | `npm run test:all` | ✅ `test:db` + Vitest (**393** passed, 2 skipped) + compliance smoke (**6/6**) |
| API routes | `find app/api -name route.ts \| wc -l` | ✅ **136** handlers |
| §4.7 API gaps | `bookings` GET, `menu/[itemId]`, `staff/[id]`, `staff/shifts` | ✅ Files present |
| CORS | `rg Access-Control-Allow-Origin app/api` | ✅ `allowedOrigin` (no `*` in code) |
| Debug auth | `app/api/debug/auth/route.ts` | ✅ 404 when `NODE_ENV=production` |
| Prod errors | `lib/utils/api-helpers.ts` | ✅ `sanitizeErrorDetails` |
| Public gated copy | `lib/copy/public.ts` → `gated` | ✅ Centralized strings |
| Public colors | `rg text-gray- app` | ✅ No matches under `app/` |
| Scripts hygiene | `scripts/` (no archive) | ✅ obsolete archive removed May 2026 |
| E2E specs | `e2e/*.spec.ts` | ✅ **8** files (incl. `responsive-layout`, gated-pricing, public-components) |
| Tours removed | `test ! -d app/tours`; `rg -i '/tours' app components lib proxy.ts` | ✅ No route or nav; `tours-guide.md` deleted |
| Service duplicates | `lib/services/fraud`, `lib/services/menu` | ✅ Single implementation each |
| Vitest (May 17) | `npx vitest run` | ✅ **427 passed \| 2 skipped** |
| Workflow YAML | `tests/workflows/*.test.ts` | ✅ **78/78** |
| PostHog unit | `tests/unit/posthog-analytics.test.ts` | ✅ **4/4** (defaults `2026-01-30`, server exception) |
| Full verify | `npm run verify:production` | `tsc` + **`test:ci`** + `build` before deploy |
| RAG ingest | `npm run rag:seed` (Qdrant Inference, 384d, batched) | ✅ Run when cluster URL + Inference enabled |
| npm audit | `npm audit --audit-level=critical` | ✅ **0 critical** (`package.json` overrides: `fast-xml-parser`, `protobufjs`); moderate/high may remain — run `npm audit` to triage |

**RAG config (operator):** Chat: `AI_PROVIDER_ORDER=deepseek,...`. Embeddings: `RAG_USE_QDRANT_INFERENCE=true`, `QDRANT_INFERENCE_MODEL=intfloat/multilingual-e5-small`, `QDRANT_INFERENCE_DIMENSIONS=384`. Ingest: `npm run rag:seed` (`@qdrant/js-client-rest`). **No Voyage** — vectors computed inside Qdrant.

**Coding rules (sampled):** ~87% of 23 rules; `tsc` clean; rate limiting on sensitive routes; DaisyUI on UI components. Utility `.js` in `scripts/` and `public/sw.js` accepted exceptions.

**Security Prompt Pack:** Canonical doc `docs/SECURITY_PROMPT_PACK.md` (§14 after features; `npm run security:preflight` + §15 before deploy). CMS HTML sanitized; upload MIME/size limits; payment/guest/AI rate limits.

**Doc hygiene:** Removed one-off `docs/*_2026-05-16.md` audit files after merging into this section.

---

## Current Tasks (In Progress)

### High Priority — SOC 2 Compliance Initiative 🔐
**Target:** Type I readiness by August 2026, Type II audit by November 2026  
**Owner:** CTO  
**Reference:** `docs/project/SOC2_IMPLEMENTATION_PLAN.md`

#### Week 1-2: Preparation
- [x] **Executive kick-off agenda** — `docs/compliance/SOC2_KICKOFF_AGENDA.md` (schedule meeting)
- [ ] **Executive kick-off meeting** — Review plan, approve N$250K-300K budget
- [ ] **Team formation** — Assign Program Lead (CTO), Technical Lead (Dev), Compliance Liaison (Ops)
- [ ] **Gap analysis workshop** — Walk through TSC Common Criteria checklist
- [ ] **CPA firm RFP** — Get quotes from Deloitte, PwC, KPMG Namibia
- [ ] **Project tracker setup** — Gantt chart in Notion/Asana/Sheets

#### Week 3: Risk Assessment
- [x] **Document risk assessment methodology** — `docs/compliance/RISK_ASSESSMENT_METHODOLOGY.md`
- [x] **Run initial risk assessment** — Top 10 in `docs/compliance/RISK_REGISTER.md`
- [x] **Create risk register** — `docs/compliance/RISK_REGISTER.md` (quarterly updates)
- [ ] **Executive review** — Present risk findings

#### Week 4: Security Policies (Critical Path)
- [x] **Write 21 core policies** — `docs/compliance/policies/` (May 17, 2026); pending CEO sign-off
  - [x] All 20 policy files + `POLICY_TEMPLATE.md` in `docs/compliance/policies/`
  - [x] Business continuity — `docs/compliance/BUSINESS_CONTINUITY_PLAN.md` (BCP)
- [ ] **Executive sign-off** — CEO/Owner approves all policies

#### Week 5: Incident Response
- [x] **Complete Incident Response Plan** (DONE)
- [x] **Conduct tabletop exercise** — Payment breach scenario (May 17, 2026)
- [x] **Document exercise results** — `docs/compliance/incidents/tabletop-2026-05-17.md`

#### Week 6: Centralized Logging
- [x] **Enable Neon pgAudit** — `database/drizzle/operator_enable_pgaudit.sql` (apply on Neon; extension plan-dependent)
- [x] **Verify audit_trail retention** — `0038_audit_trail_immutable.sql` + `npm run compliance:verify-audit-trail`
- [x] **Optional: Vercel log export** — Documented `docs/compliance/VERCEL_LOG_EXPORT.md` (optional drain)
- [x] **Log review process** — `docs/compliance/log-reviews/README.md` + `2026-05-17-weekly.md`

#### Week 7: Business Continuity Plan
- [x] **Document BCP** — `docs/compliance/BUSINESS_CONTINUITY_PLAN.md`
- [x] **Define recovery procedures** — Neon PITR + Vercel rollback in BCP §4.2–4.2b
- [x] **Schedule quarterly restore test** — BCP §6 (Feb/May/Aug/Nov); evidence template in calendar

#### Week 8: Vendor Risk Management
- [x] **Request SOC 2 reports (drafts)** — `compliance/evidence/vendor-attestations/outbox/*.md` + REQUEST_TEMPLATE (send emails)
- [x] **Complete vendor risk assessment** — `docs/compliance/VENDOR_RISK_ASSESSMENT_2026.md`
- [x] **Store attestations** — `compliance/evidence/vendor-attestations/` (README + naming convention; PDFs when received)

### High Priority — Security Review Process 🛡️
**Owner:** All Developers  
**Reference:** `docs/SECURITY_PROMPT_PACK.md`

#### Continuous Security Reviews (Immediate)
- [x] **Integrate Security Prompt Pack** — `docs/compliance/SECURITY_DEV_ONBOARDING.md` (§1–15 + commands)
- [x] **Update PR template** — `.github/pull_request_template.md` (§14 checklist)
- [x] **Add pre-deploy hook** — `npm run deploy:prod` → preflight + audit triage + `vercel deploy --prod`
- [ ] **Team training** — 1-hour walkthrough of Security Prompt Pack sections (schedule with CTO)

#### Weekly Security Tasks
- [x] **Monday:** `npm run security:audit-triage` + CI `.github/workflows/security-audit.yml` (ongoing cadence)
- [x] **Wednesday:** Log review template — `docs/compliance/log-reviews/` (ongoing cadence)
- [x] **Friday:** `npm run security:scan-secrets` (ongoing cadence)

#### Monthly Security Tasks (Last Business Day)
- [ ] **Export evidence package** — `GET /api/compliance/soc2?action=export` (hub admin) — first run pending
- [x] **Update risk register** — Initial `RISK_REGISTER.md` (May 17); refresh quarterly
- [ ] **Review API key rotation** — Rotate keys older than 90 days
- [ ] **Security awareness reminder** — Share security tip in team channel

#### Feature Development Security Checklist
For every new feature or significant code change:
1. [x] Run relevant Security Prompt Pack section (see PR template):
   - Forms/validation: § 1 (Frontend-Only Validation)
   - Auth/sessions: § 3 (Authentication & Session Security)
   - Permissions: § 4 (Missing Permission Checks)
   - File uploads: § 7 (File Upload Security)
   - API endpoints: § 8 (Rate Limiting & Brute Force)
2. [x] Run § 14 (The Master Security Review) — PR template + `npm run security:preflight`
3. [x] Document security decisions in PR description — PR template § Security notes
4. [ ] Before merge: Code reviewer runs § 14 independently (process)

#### Week 9-10: Evidence Automation
- [x] **Evaluate Vanta vs manual** — **Manual** chosen (`docs/compliance/EVIDENCE_CALENDAR.md`)
- [ ] **If Vanta: Setup integrations** — N/A unless budget approved
- [x] **If manual: Create evidence calendar** — `docs/compliance/EVIDENCE_CALENDAR.md`

#### Week 11-24: Evidence Collection (6-Month Observation)
- [x] **Monthly evidence exports** — Calendar + `scripts/soc2/collect-evidence.ts` + CI `soc2-evidence.yml`
- [x] **Quarterly risk register updates** — Process in `RISK_REGISTER.md` (next: Aug 2026)
- [x] **Weekly log reviews** — Process + `log-reviews/` (ongoing cadence)
- [x] **Upload to evidence folder** — `npm run compliance:monthly-evidence` → `compliance/evidence/YYYY-MM/`

#### Week 21-22: Select CPA Auditor
- [ ] **Book audit slots** — Deloitte/PwC/KPMG (availability Nov 2026)
- [ ] **Negotiate fixed-fee** — Target N$75K-120K for Type II

#### Week 23-24: Readiness Assessment
- [ ] **Run Type I readiness** — CPA gap report (~N$25K, 2-3 weeks)
- [ ] **Remediate critical gaps** — Address findings before Type II

#### Week 25-28: SOC 2 Type II Audit
- [ ] **Planning phase** — Control matrix, sample selection
- [ ] **Fieldwork** — CPA tests controls, interviews staff
- [ ] **Draft report review** — Management responses
- [ ] **Final SOC 2 report** — CPA issues opinion

### High Priority — Platform Stability
- [x] **RAG ingestion** — `npm run rag:seed` (**4 docs**, 27 chunks, Qdrant Inference 384d; purges stale tenant points)
- [x] **npm audit triage** — `npm run security:audit-triage` → `compliance/evidence/security/npm-audit-triage-*.json` (0 critical May 17)

### Medium Priority
- [x] **Production smoke (automated subset)** — `npm run compliance:production-smoke` (§0 public paths); staff/payment paths still manual per §0 table. **Note (May 17):** live `/tours` still returns 200 until next prod deploy — expect 404 after tours removal ships.
- [x] **UI enhancements** — `ReviewCard`, `Skeleton`/`SkeletonStatsRow`, khaki `:focus-visible` in `globals.css`; dashboard loading skeletons
- [x] **`/tours` explicit 404** — `app/tours/page.tsx` → `notFound()` (deploy for prod smoke)

### Low Priority
- [x] **Docker Compose** — `npm run compliance:verify-docker` (Redis + Qdrant; Neon for DB)
- [x] **API documentation guide** — `docs/API_GUIDE.md`

---

## Completed Tasks

### Phase 1: Public Pages ✅
- [x] Tours product removed (`/tours` deleted; nav/footer/proxy/copy/knowledge aligned — PRD v2.7.2+)
- [x] Database-driven landing page
- [x] Rooms section with real data
- [x] Dining section with menu
- [x] Digital menu on `/dining` — `MenuBookFullMenu` + `MenuBookSinglePageViewer`, DB-only load, analytics guest favourites, `image_url` seed/validate scripts (PRD §3.1.1)
- [x] Menu layout — single-page viewer (`MenuBookSinglePageViewer`), Previous/Next; food **6/page (2×3)** with name, description, price on tiles; drinks list; view-only public menu + CMS edit at `/menu/[itemId]/edit`
- [x] Room photo tours on `/rooms` + `/rooms/[slug]` — `RoomPhotoTour`, filmstrip listing, included-amenities strip, browse-only banner, Premier 4 guests / 6 stops (`lib/rooms/room-display.ts`, PRD §3.1.2)
- [x] Room tour gating — public: masked rates, **Take the tour** CTA, sign-in to book; signed-in: same tour + rates + `#booking` widget (PRD v2.8.0)
- [x] `/rooms#tour` anchor on filmstrip; `lib/rooms/public-rate.ts` + availability API strips `baseRate` for guests
- [x] **Guest vs staff sign-in** — header **Sign in** → `/login?redirect=/guest`; footer **Staff & platform login** → `/login?redirect=/dashboard` (`NavigationHeader`, `PublicFooter`, `lib/copy/public.ts` — PRD §3.3.1)
- [x] **Session-aware public nav** — `PublicAuthNav` shows **Sign out** + **My stay** / **Dashboard** / **Platform** when authenticated; `DevTestSessionBanner` for stale `@example.com` dev cookies (PRD §3.3.1)
- [x] **Room detail guest CTA** — `PublicRoomTourSignInCard`; `RoomBookingCard` client-gated via `useSession` (PRD §3.1.2)
- [x] **Buffr platform admin** — `getCurrentPlatformAdmin()` uses NextAuth when Stack disabled; `super-admin` full route access in `proxy.ts`; `scripts/provision-platform-admin.ts`; `george@buffr.ai` provisioned in Neon (PRD §3.3.2)
- [x] **Guest hub (v2.8.4)** — `GET /api/guest/stays` returns `pastStays` + `loyalty`; `GuestStaysList` + `GuestLoyaltySummary`; past folio read-only; register as `guest` on hub tenant (`lib/utils/hub-tenant.ts`); `lib/auth/roles.ts` + role-aware `LoginForm`; `user`/`guest` proxy + `/profile` (PRD §3.3.3)
- [x] `tests/unit/auth-roles.test.ts` — post-login paths + guest consumer roles
- [x] **Schema + security (v2.8.5)** — `linkGuestAccount.ts`; verified-email login; `assertStayAccess` + `GUEST_API_ROLES`; proxy redirect + Stack RBAC; khaki/terracotta Tailwind ramps; guest UI semantic errors
- [x] **Production (v2.8.6)** — `password.ts` (12+); Turnstile register; `schema-types.ts`; Redis fail-closed limits; `dev-log`; `GuestNavLink`; PRD §3.3.4 checklist; `.env.example` production vars
- [x] **PRD system map (v2.9.0)** — `docs/project/PRD.md` **§3.6**: project structure, user journeys, access/authorization, role can/cannot; PLANNING cross-ref
- [ ] **Pre-launch** — Vercel: `REDIS_URL` + `RATE_LIMIT_REDIS_REQUIRED=true` (fail-closed 429 if Redis down), Turnstile keys, `db:push` + smoke register → verify → `/guest`
- [x] Stack Auth guard — `lib/auth/stack-env.ts` disables SDK when keys are placeholders (`StackProviderWrapper`, `stack.ts`, `tests/unit/stack-env.test.ts`)
- [x] `tests/unit/public-session-nav.test.ts` — account href labels + disposable test email detection
- [x] `tests/unit/room-display.test.ts` — Premier occupancy, tour stops, mini-fridge strip
- [x] Reviews section (approved only)
- [x] Partners section
- [x] Footer contact information
- [x] Gated rates until login
- [x] `getPartnerBySlug` implementation

### Phase 2: Cash Payment System ✅
- [x] Neon schema columns: `payment_method`, `payment_status`, `amount_tendered`, `change_given`, `receipt_number`
- [x] `cash_reconciliations` table
- [x] `BookingCashPaymentSection` component
- [x] Reconciliation UI at `/payments/reconciliation`
- [x] Receipt modal with print functionality
- [x] Date filter and discrepancy workflow

### Phase 2a: NamQR v5 + off-platform desk ✅
- [x] NamQR v5 TLV/CRC (`namqr-core.ts`, `lib/compliance/namqr/nrtc-payload.ts`, `standards.ts`) aligned to BoN May 2025 / `mba-agent/.../namibia_qr_code_standards.md`
- [x] `POST /api/payments/namqr/generate`, `POST /api/payments/namqr/confirm` + desk UI `/payments/desk` + folio embed
- [x] Sidebar nav: **Payments desk**, **Cash reconciliation** (`components/shared/Sidebar.tsx`)
- [x] `ManualPaymentService` + `POST /api/payments/manual` (EFT, e-wallet, bank deposit); NamQR folio path = generate/confirm only (desk panel — not manual form rail)
- [x] `npm run test:db:migrations` → `scripts/db/verify-neon-migrations.ts`
- [x] Unified folio settlement: `settleOffPlatformFolio.ts` → `FolioService` (manual + NamQR confirm)
- [x] Payment receipt email on NamQR desk confirm + NamQR manual folio settle (`schedulePaymentReceiptEmail`, `NAMQR_RECEIPT_PAYMENT_METHOD`)
- [x] Unit tests `tests/unit/namqr-v5.test.ts`, `tests/unit/namqr-receipt-trigger.test.ts`
- [x] Bank CSV/MT940 import (`0025`, `BankReconciliationService`) — **manual match only** (no auto-match on import)
- [x] ~~NamClear API ingest~~ — **Cancelled / out of scope** (May 2026)
- [x] Guest NamQR on folio — Option B (QR + bank ref submit; staff approve at `/payments/desk`; migration `0020_namqr_pending_confirmations.sql`)

### Phase 2b: Adumo Virtual (card) 🚧
- [x] `AdumoVirtualService`, `completeAdumoVirtualPayment`, `payment_sessions` migration
- [x] `POST /api/payments/virtual/initiate`, `/confirm`, `POST /api/webhooks/adumo`
- [x] `AdumoVirtualPaymentForm`, `/payment/success`, `/payment/failed`
- [x] Run `database/drizzle/0012_adumo_virtual_payment_sessions.sql` on Neon (see Neon operator migrations)
- [x] Wire `AdumoVirtualPaymentForm` on guest folio settle UI
- [x] Wire `AdumoVirtualPaymentForm` on online booking checkout (deposit) — `BookingDepositPayCard` on `/guest/stays/[id]` after `POST /api/guest/bookings` (J-G1 Wave 5)
- [ ] Staging test: Visa `4000000000001091` (3DS app UID) — **operator sign-off:** `compliance/evidence/adumo/staging-smoke-2026-05-17.md` after card run; preflight: `npm run compliance:adumo-preflight`
- [ ] Live Adumo credentials + portal branding; production smoke on `hoteletuna.com` — runbook §3: `docs/compliance/ADUMO_GO_LIVE_RUNBOOK.md`; `npm run env:push-vercel` + Vercel live `ADUMO_*` secrets
- [ ] Confirm with Adumo: settlement account = **Hotel Etuna Nedbank** (not Buffr) — send `compliance/evidence/adumo/outbox/settlement-confirmation-request.md`; file reply under `compliance/evidence/adumo/`

### Phase 2c: Buffr platform billing (commercial model) ✅
- [x] Bank profiles in `lib/platform/settlement-accounts.ts` (Etuna Nedbank + Buffr Bank Windhoek)
- [x] `PlatformFeeService` accrual on card confirm → `transactions.metadata.platformFee`
- [x] Contract fee schedule → env `BUFFR_*` + `PATCH /api/platform/billing/schedule`
- [x] Migration `0013_platform_billing.sql` — settlement_accounts, fee accruals, invoices (PRD §3.5.3)
- [x] Property hub: draft/issue/mark-paid at `/payments/platform-billing`
- [x] Invoice export `GET .../invoices/[id]/export?format=html|csv` (print to PDF in browser)
- [ ] Buffr platform-admin cross-tenant invoice console (optional; property UI sufficient for Etuna)

### Neon operator migrations (runbook — not in Drizzle journal past 0002)
Apply in order on staging/production, then verify with `npm run test:db:migrations`:
- [x] `0011_fnb_inventory.sql` — applied Neon May 2026
- [x] `0012_adumo_virtual_payment_sessions.sql`
- [x] `0013_platform_billing.sql`
- [x] `0014_platform_invoice_vat.sql`
- [x] `0015_rls_inventory_payment_sessions.sql` (RLS for inventory + payment_sessions)
- [x] `0016_fraud_detection_rules_seed.sql` — superseded by **`0037_os_seed_defaults.sql`** (3 fraud rules per operator tenant)
- [x] **0026/0028/0030** (+ `b` RLS) — applied Neon May 17 (Neon MCP + verify script)
- [x] **0037_os_seed_defaults.sql** — fraud + loyalty catalog + introducer tiers on Neon

### Wave 1c: F&B print dispatch (Agent 4) ✅

- [x] Migration `database/drizzle/0032_fnb_print_jobs.sql` + `0032b_fnb_print_jobs_rls.sql`
- [x] `lib/services/fnb/FnbPrintDispatchService.ts` — route by `cms_menu_items.metadata.printStation`
- [x] `FnbPrintAdapter` + `NetworkPrinterAdapter` (ESC/POS TCP; **fails** when `FNB_PRINT_*` unset or unreachable)
- [x] Auto-dispatch on order → `preparing` (`OrderService.transitionOrderStatus`)
- [x] `POST /api/restaurant/orders/[id]/print` — staff reprint (rate-limited)
- [x] Reprint UI on `(dashboard)/restaurant/orders` (`OrderCard`)
- [x] Kitchen ticket board `(dashboard)/restaurant/tickets` — `FnbKitchenTicketBoard`, `GET /api/restaurant/print-jobs`
- [x] Sidebar **Kitchen tickets** → `/restaurant/tickets`
- [x] Vitest `tests/unit/fnb-print-dispatch.test.ts` (mock adapter)
- [x] Vitest `tests/unit/fnb-kitchen-board.test.ts` (filter/sort helpers)
- [x] Apply `0032` + `0032b` on Neon (via `db:reset` / operator apply — May 2026)
- [x] **Board-only mode** when no printer (`FNB_PRINT_MODE` unset or `board_only`) — no Vercel printer env required
- [ ] Optional later: `FNB_PRINT_MODE=tcp` + `FNB_PRINT_KITCHEN_URL` / `FNB_PRINT_BAR_URL` when hardware installed

### Phase 2d: F&B inventory 🚧
- [x] Migration `database/drizzle/0011_fnb_inventory.sql` (inventory_items, menu links, movements, stock_alerts)
- [x] `lib/services/inventory/InventoryService.ts` — list, adjust stock, deduct on orders, low-stock alerts
- [x] APIs `GET/PATCH /api/inventory/items`, `GET/PATCH /api/inventory/alerts`
- [x] Seed data `lib/data/etuna-inventory-seed.ts`; order hooks in `OrderService.ts`
- [x] RLS migration authored: `0015_rls_inventory_payment_sessions.sql`
- [x] Verify migration `0011` + `0015` applied on Neon (`npm run test:db:migrations` — May 2026)
- [x] Low-stock alerts dashboard UI — `/inventory/alerts`, sidebar link + badge, acknowledge/dismiss via PATCH
- [x] Low-stock alerts UI — `/inventory/alerts` + sidebar badge
- [ ] Low-stock alerts QA — trigger below reorder point → acknowledge/dismiss (manual) (manual)

### Phase 3: PWA / Offline ✅
- [x] `public/manifest.json`
- [x] Service worker routes
- [x] Offline capability
- [x] PWA install prompt

### Phase 4: Session Timeout ✅
- [x] `SessionTimeoutWrapper` component
- [x] Auto-logout after inactivity
- [x] Session renewal on activity

### Phase 5: Sofia AI / RAG ✅
- [x] Sofia transactional email templates refreshed (`EmailTemplateService`, branded generator + Valley Street signature; no tours in copy)
- [x] Email triggers: booking confirm/cancel/check-in/out/pre-arrival cron, payment receipt (Adumo + cash + **NamQR**), Sofia auto-reply
- [x] Template/signature validation: `scripts/validate-sofia-email-templates.ts`; Vitest `tests/sofia/sofia-email.test.ts`, `tests/unit/email-signature.test.ts`
- [x] Sofia intent: guest-message-first `resolveIntent()` in `SofiaConciergeService` + `tests/unit/sofia-intent-resolve.test.ts`
- [x] Qdrant Cloud Inference embeddings (`embeddings-rag.ts`, 384d e5-small)
- [x] RAG services implementation
- [x] Ingestion script (`scripts/ingest-hotel-etuna-knowledge.ts`)
- [x] Semantic chunking (27 chunks from **4** knowledge files; `tours-guide.md` removed)
- [x] **Embedding & upsert to Qdrant** — `npm run rag:seed` via Qdrant Inference

### Phase 6: Testing ✅
- [x] **Vitest:** 393/395 default run (hub seed validation optional via `RUN_HUB_SEED_VALIDATION=true`)
- [x] **`npm run test:db`** — `scripts/db/verify-db.ts` (canonical)
- [x] **`npm run test:db:migrations`** — 18 checks (`scripts/db/verify-neon-migrations.ts`, incl. `0017`)
- [x] **`npm run test:smoke`** — DB verify + `tests/smoke/compliance-fraud-db.smoke.test.ts` (6 tests)
- [x] **`npm run test:all`** / **`npm run test:ci`** — `test:db` + `test:db:migrations` + Vitest + smoke (CI + pre-merge gate)
- [x] **`npm run verify:production`** — `tsc` + `test:ci` + `next build`
- [x] **GitHub Actions** — `.github/workflows/ci.yml` runs full `test:ci`; `deploy.yml` after CI on `main`
- [x] **Vercel Git** — `vercel git connect` → `thependalorian/hotel-etuna` (auto-deploy `main`)
- [x] **TypeScript compilation:** Zero errors
- [x] **Production build:** Successful
- [x] **Playwright E2E:** 
  - **8** specs: navigation, homepage, design-system, authentication, auth-journey, gated-pricing, public-components, **responsive-layout**
  - Viewports: desktop + **mobile-chrome** + **tablet** (`playwright.config.ts`)
  - Optional: `npm run test:e2e` / `test:e2e:responsive` (needs app on `:3010` or `PLAYWRIGHT_BASE_URL`)
- [x] **PostHog:** `instrumentation-client.ts`, `@posthog/react`, `lib/posthog-client-options.ts` (`defaults: '2026-01-30'`); `posthog-js` **1.373.5**
- [x] **Sofia Email FK Fix:** Resolved tenant_id foreign key constraint violation
- [x] **Test Coverage Enhancements:**
  - Gated pricing behavior tests
  - Public component rendering tests (Hero, Footer, Nav, etc.)
  - Auth-gated action redirect tests

### Phase 7: Documentation ✅
- [x] Project documentation in `docs/project/`
- [x] Testing procedures (§ Production smoke, § Testing procedures)
- [x] Production smoke test templates
- [x] User journey verification
- [x] Environment configuration verification

### Production Readiness ✅
- [x] Hub tenant seeded (Hotel Etuna)
- [x] Partner network seeded (JayLa, Aquarius)
- [x] RLS policies verified (100% tenant isolation)
- [x] TypeScript compilation passing
- [x] Production build successful
- [x] Duplicate schemas removed
- [x] Prisma fully removed
- [x] Personal files cleaned from `public/`
- [x] Documentation organized
- [x] Empty directories removed

---

## Testing Procedures

### §0: Production Smoke Test (Critical Path)

Run this on **live production URL** after every deploy:

| # | Area | Action | Pass Criteria |
|---|------|--------|---------------|
| 1 | Health | Open `/` | 200, no blank shell, footer contact loads |
| 2 | Public hub | `/` — `#rooms`, `#dining`, reviews; **no** `#partners` grid on home | Teaser links to `/partners`; gated room prices until login |
| 2a | Partners directory | `/partners`, `/partners/[slug]` | Full partner grid; rates gated until sign-in |
| 2b | Tours retired | `GET /tours` | **404** (no redirect to marketing) |
| 3 | Partner | `/partners/[slug]` | Page loads; rates gated |
| 4 | Staff login | `/login` → dashboard | Session works |
| 5 | Cash booking | `/bookings/[id]` (cash booking) | Mark paid → receipt / print OK |
| 6 | Reconciliation | `/payments/reconciliation` | Date filter + save discrepancy flow OK |
| 6b | Payments desk | `/payments/desk` | Generate NamQR + confirm on folio OR manual EFT record |
| 7 | Reviews CRM | `/crm/reviews` | Toggle `is_public`; landing `#reviews` updates after ISR |
| 8 | Sofia | Hub Sofia chat | Reply without errors (RAG optional) |
| 9 | Vercel | Dashboard logs | No spike of 5xx on deploy |

**Automated Gates (run locally before merge):**

```bash
npx tsc --noEmit
npm run build
npm run test:all          # test:db + vitest + compliance smoke (~15 min)
# Or stepwise:
npm run test:db
npm run test:db:migrations
npx vitest run
npm run test:smoke
# Playwright (separate; app on :3010 or PLAYWRIGHT_BASE_URL):
npm run test:e2e:responsive   # overflow + mobile nav
npm run test:e2e:mobile       # Pixel 5 project only
```

### Local Development Testing

```bash
# Start dev server
npm run dev

# Visit http://localhost:3000
# Test critical paths from smoke test above

# Hotel hub admin (operations)
# Email: manager@hoteletuna.com
# Password: Test1234!  (or ADMIN_PASSWORD from .env.local)

# Buffr platform admin (cross-tenant /admin/platform)
# Email: george@buffr.ai
# Password: ADMIN_PASSWORD or Test1234! (set via provision script)
# npx tsx scripts/provision-platform-admin.ts --email george@buffr.ai --link-hub

# Sign out stale test sessions: header "Sign out" or DevTestSessionBanner (dev @example.com)

# Test review approval at /crm/reviews
```

### API Testing

#### Get All Reviews (Admin Only)
```bash
curl -v -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  http://localhost:3000/api/crm/reviews
```

#### Toggle Review Visibility
```bash
# Approve
curl -v -X PATCH \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"is_public": true}' \
  http://localhost:3000/api/crm/reviews/REVIEW_ID

# Hide
curl -v -X PATCH \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"is_public": false}' \
  http://localhost:3000/api/crm/reviews/REVIEW_ID
```

### Database Verification

#### Check Rooms
```bash
psql $DATABASE_URL -c "
  SELECT room_type, base_rate, max_occupancy 
  FROM rooms 
  WHERE property_id = '$DEFAULT_PROPERTY_ID'
  ORDER BY base_rate;
"
```

#### Check Approved Reviews
```bash
psql $DATABASE_URL -c "
  SELECT gr.id, gr.rating, gr.review_text, gr.is_public, 
         g.first_name, g.city, g.country
  FROM guest_reviews gr
  LEFT JOIN guests g ON g.id = gr.guest_id
  WHERE gr.tenant_id = '$HUB_TENANT_ID'
    AND gr.is_public = true
  ORDER BY gr.created_at DESC
  LIMIT 6;
"
```

#### Check Active Partners
```bash
psql $DATABASE_URL -c "
  SELECT t.name as tenant_name, t.status, p.name as property_name, p.slug, p.city
  FROM tenants t
  LEFT JOIN properties p ON p.tenant_id = t.id
  WHERE t.type = 'partner' AND t.status = 'active'
  LIMIT 3;
"
```

### Edge Cases to Test

1. **No Approved Reviews**
   - Hide all reviews temporarily
   - Verify empty state message displays
   - No errors in console

2. **Guest Deleted (Review Orphaned)**
   - Delete guest with reviews
   - Verify review still shows with fallback name
   - No errors

3. **Partner Has No Property**
   - Create partner without property
   - Verify partner doesn't appear on landing
   - No errors

4. **ISR Verification**
   - Change room price in database
   - Refresh immediately → old price
   - Wait 5 minutes → new price

### Performance Testing

**Targets (master guide Part 5 + PRD §6.4):**

| Metric | Target | How to verify |
|--------|--------|---------------|
| DB queries (hot paths) | &lt; 100ms | `EXPLAIN ANALYZE` on landing room/review queries |
| TTFB (landing, cached) | &lt; 500ms excl. images | Lighthouse / Vercel Speed Insights |
| API p95 (auth routes) | &lt; 300ms | Vercel logs after smoke test |
| ISR staleness | ≤ 300s | Toggle review → landing updates within window |

```bash
psql $DATABASE_URL -c "ALTER DATABASE your_db SET log_statement = 'all';"
# Visit landing page and check logs
```

**Caching smoke:** Change room `base_rate` in DB → immediate refresh shows old price → after 300s (or `revalidatePath`) shows new price.

---

## Verification Checklists

### AI Security Prompt Pack (15 sections)

**Canonical prompts:** `docs/SECURITY_PROMPT_PACK.md` (Hotel Etuna–tailored; copy into Cursor/Claude after each feature).  
**Automated pre-flight (§15):** `npx tsx scripts/security/run-preflight.ts` → `compliance/evidence/security/`.  
**Reference:** `SYSTEM_DESIGN_MASTER_GUIDE.md` Part 10. Summary mapping:

| # | Gap | Hotel Etuna surfaces | Verify |
|---|-----|----------------------|--------|
| 1 | Frontend-only validation | Booking forms, partner invite, cash modal, folio orders | Replay API with DevTools; backend must 400 |
| 2 | Hardcoded secrets | `.env.local`, Vercel env, `lib/` | `rg -i "sk-|api_key|password=" app lib` — none in repo |
| 3 | Auth & session | `/login`, `SessionTimeoutWrapper`, `proxy.ts` | Idle 30m, absolute 8h, logout invalidates session |
| 4 | Broken access control | Partner vs hub routes, folio by `bookingId` | Partner 403 on `/api/sofia/*`, `/api/crm/*`; guest folio email match |
| 5 | Error / data leaks | All `app/api/**` | Production errors: no stack traces, no `DATABASE_URL` in JSON |
| 6 | Injection (SQL, XSS, CSRF) | Drizzle routes, review text, CRM | Parameterized queries; escape/sanitize user HTML; SameSite cookies |
| 7 | File uploads | Property images (Vercel Blob) | Type/size limits 5MB; no executable extensions |
| 8 | Rate limiting | Login, partner invite, payments | Invite 5/hr; public 100/min/IP (PRD) |
| 9 | HTTPS & headers | Vercel production | `https://www.hoteletuna.com` (canonical); security headers via platform |
| 10 | PII / privacy | `guests`, CRM, audit | Minimize fields; GDPR erasure backlog in Compliance |
| 11 | Insecure defaults | `NODE_ENV=production` | No debug routes; CORS not `*` for credentialed APIs |
| 12 | Dependencies | `package.json` | `npm audit` — no critical unfixed before release |
| 13 | Logging & audit | `audit_trail`, cash transitions | Sensitive ops logged; logs exclude passwords/tokens |
| 14 | Master review | Any new feature | Run master prompt twice (guide Gap 14) before merge |

**Master prompt (paste into AI assistant after feature work):**

```text
I just finished building [feature] in Hotel Etuna (Next.js + Neon + RLS).
Review only the new code for: (1) auth+authz on every endpoint,
(2) no hardcoded secrets, (3) backend validation, (4) safe errors,
(5) sanitized user content, (6) parameterized SQL, (7) upload limits,
(8) rate limits, (9) CSRF on state changes, (10) minimal PII in responses.
Fix issues and list what changed.
```

### Pre-launch security review (Deployment Pre-Flight §15)

**Last Audit:** May 18, 2026 (full code review + remediation)  
**Status:** 🟢 **Static preflight pass** — `npm run security:preflight` (**14/14**); **188** API routes · **144** `withApiAuth` (77%) · **44** intentional public/alternate-auth (cron, webhooks, auth, platform-admin, availability)  
**Evidence:** `compliance/evidence/security/preflight-2026-05-18.json`, `security-audit-2026-05-18.json`, `api-coverage-2026-05-18.json`  
**Detail:** This section + § Verified Implementation Audit + `docs/SECURITY_PROMPT_PACK.md` §14–§15

| # | Check | Result | Notes |
|---|--------|--------|-------|
| 1 | Secrets in env only | ✅ | PF-02; `npm run security:scan-secrets` on app/lib/components |
| 2 | Backend validation | 🟡 | Zod on recon/inventory/cash-up; **2** legacy booking routes — `security:audit-api-coverage` |
| 3 | Parameterized SQL | ✅ | Drizzle; `0038` audit_trail append-only |
| 4 | Auth + authz | ✅ | Payments recon suite + CRM reviews + inventory on `withApiAuth`; cash-up tenant-scoped (May 17) |
| 5 | Safe errors | ✅ | `sanitizeErrorDetails` + `errorResponse` on migrated routes |
| 6 | CORS not `*` | ✅ | PF-06 |
| 7 | Debug off in prod | ✅ | PF-07 |
| 8 | Secure cookies | ✅ | NextAuth session cookies |
| 9 | HTTPS | ✅ | Vercel + `NEXTAUTH_URL` https |
| 10 | Rate limits | ✅ | PF-10 + proxy; `/api/guest/bookings` **10/min**; **0** legacy `getServerSession` in `app/api` |
| 10b | Guest folio payment integrity | ✅ | `POST …/settle` **403** for guests; NamQR QR bound to `namqr_codes` (May 18) |
| 11 | Upload validation | ✅ | PF-11 MIME whitelist + 5MB (`createCmsMediaSchema`) |
| 12 | `npm audit` | ✅ | **0 critical** — PF-12 + `npm run security:audit-triage` |
| 13 | No dev artifacts | 🟡 | Demo partners — disable in prod DB before go-live |
| 14 | RLS | ✅ | `npm run test:db:rls` / `compliance:verify-audit-trail` |
| 15 | Security audit logging | ✅ | 401/403 + failed login → `audit_trail` via `logAuthCredentialFailure` / `security-logger` (hub tenant env) |

Run before major production releases (full prompt in Security Prompt Pack §15):

- [x] All secrets in Vercel env — not in git
- [x] Backend validation on all mutating APIs
- [x] Drizzle/parameterized SQL only
- [x] Auth + tenant on every protected route
- [x] Safe error messages in production
- [x] CORS locked to production domain ✅ **FIXED May 16, 2026**
- [x] Secure, `httpOnly`, `SameSite` session cookies
- [x] HTTPS enforced (Vercel)
- [x] Rate limits on login, invite, payment initiate
- [x] `npm audit` — **0 critical** at `--audit-level=critical` (May 16); triage moderate/high as needed (`npm audit`)
- [x] No test credentials in production DB
- [x] RLS script passes: `npx tsx scripts/db/verify-tenant-rls.ts`
- [x] Debug endpoints disabled in production ✅ **FIXED May 16, 2026**
- [x] Cash payment IDOR — tenant match on booking ✅ **FIXED May 16, 2026**

**Recommended Before Next Deploy:**
```bash
npm audit fix
npm update fast-xml-parser langsmith next
npm test && npm run build
```

### Software design PR checklist

From master guide Part 1 + Buffr audit lessons — quick gate for reviewers (`.github/pull_request_template.md` mirrors this):

- [ ] No duplicate auth/error boilerplate — use `withApiAuth` + `errorResponse` / `successResponse` from `lib/utils/api-helpers.ts`
- [ ] GET handlers do not mutate state
- [ ] Migration is forward-only and idempotent
- [ ] No `DROP` on `audit_trail` or compliance tables (`0038` append-only)
- [ ] New UI in `/components` with top-of-file purpose comment
- [ ] `tenant_id` set for all writes (app + RLS); run `npm run test:db:rls` when touching tenant data

**Pre-merge security (protected routes):**
```bash
npm run security:preflight          # 14/14 static checks
npm run security:audit-api-coverage # withApiAuth coverage (77% wrapped; rest intentional)
npm run security:audit-public-routes # cron/webhook/shared-secret inventory
npm run security:scan-secrets
```

### Security Verification ✅

**Last Security Audit:** May 18, 2026 (full-scale: docs + 188 routes + guest payment hardening)  
**Score:** 🟢 **~94/100** (Production-ready — preflight **14/14**)

**Static preflight (`npm run security:preflight`):** ✅ **14 pass / 0 warn / 0 fail** (evidence: `compliance/evidence/security/preflight-2026-05-18.json`)

**Guest API (May 18):** All `/api/guest/**` use `withApiAuth` + `GUEST_API_ROLES`; booking routes use `assertStayAccess`; unverified card/cash settle blocked; NamQR tenant + QR validation hardened.

**API auth coverage (May 18):** **119/183** on `withApiAuth` (65%); **0** legacy `getServerSession` — evidence: `compliance/evidence/security/api-coverage-2026-05-18.json`

**14-Gap AI Security Prompt Pack (aligned to preflight):**
- ✅ **Pass:** 12/12 preflight checks (PF-01 … PF-15 subset)
- ⚠️ **Residual:** demo partners in prod DB; set `ETUNA_TENANT_ID` on Vercel for hub `audit_trail` rows

**Fixes Applied (May 16–17, 2026):**
- [x] ✅ CORS restricted on payment + compliance endpoints
- [x] ✅ Debug endpoint disabled in production
- [x] Bank recon + cash-up + CRM reviews + inventory → `withApiAuth` + tenant-scoped queries
- [x] Cash reconciliation GET/POST — no prod `error.message` leak; `tenant_id` on booking queries
- [x] `security-logger` — 401/403 → `audit_trail` when hub tenant env set
- [x] Dependency audit — **0 critical**; `npm run security:audit-triage` → `compliance/evidence/security/npm-audit-triage-2026-05-17.json`

**Security Measures Verified:**
- [x] RLS policies enforced at database level
- [x] Partner data isolated from hub
- [x] Tenant context middleware active
- [x] Authentication required for admin routes
- [x] Partner access restricted to own dashboard
- [x] No cross-tenant data leaks detected
- [x] Hub tenant cannot be accessed by partners
- [x] Partner cannot access Sofia/CRM/AI features
- [x] Guest folio email matching enforced
- [x] Backend validation on all forms
- [x] No hardcoded secrets in codebase
- [x] Production error messages sanitized
- [x] Rate limiting on sensitive endpoints
- [x] Session timeout (30m idle, 8h absolute)
- [x] 2FA on payment endpoints
- [x] Audit logging on sensitive operations

**Security & compliance scripts:**
```bash
npm run security:preflight
npm run security:audit-api-coverage
npm run security:audit-triage
npm run security:scan-secrets
npm run compliance:verify-audit-trail
npm run compliance:production-smoke
npm run deploy:prod                    # preflight + vercel --prod
```

**RLS Test Script:**
```bash
npx tsx scripts/db/verify-tenant-rls.ts
# or: npm run test:db:rls
```

**Expected Results:**
- ✅ Hub + partner fixture data created
- ✅ Verifier role created and connected
- ✅ Partner context cannot read hub bookings
- ✅ Partner context can read own bookings
- ✅ Partner context cannot insert with wrong tenant_id

### SOC 2 readiness (May 2026)

**Baseline:** NayaOne Limited SOC 2 Type II (Security, Availability, Confidentiality). **Not** a CPA report.

| Item | Location |
|------|----------|
| Six audit agents | `lib/compliance/soc2/agents/*` |
| Orchestrator (single path) | `Soc2AuditOrchestrator.ts` → `Soc2ComplianceService.ts` (export) → `/api/compliance/soc2` |
| API | `GET /api/compliance/soc2` (+ `/audit` alias); hub-only via `HUB_TENANT_ID` |
| Staff UI | `/compliance/soc2` |
| CLI | `npx tsx scripts/soc2/collect-evidence.ts` |
| Weekly CI | `.github/workflows/soc2-evidence.yml` |
| Monthly evidence | `npm run compliance:monthly-evidence` |
| Tabletop / BCP | `docs/compliance/incidents/tabletop-2026-05-17.md`, `BUSINESS_CONTINUITY_PLAN.md` |
| Vendor attestations | `compliance/evidence/vendor-attestations/` |
| Onboarding | `docs/SECURITY_DEV_ONBOARDING.md` |

**Roadmap (from gap analysis):** formal policies (CC1), org-wide MFA, vendor SOC reviews (Vercel/Neon/Adumo), 365d log retention (`0038` + `compliance:verify-audit-trail`), Type I then 6–12mo Type II.

### Build Verification ✅

```bash
# Security (run before release)
npm run security:preflight
npm run security:audit-api-coverage

# TypeScript check (known pre-existing errors in some services — track separately)
npx tsc --noEmit

# Production build
npm run build
# Expected: ~183 API route files, ~61 pages (counts vary with deploy)

# Vitest
npx vitest run
# Expected: 393/395 passing (2 hub-seed tests skipped unless RUN_HUB_SEED_VALIDATION=true)

# Full gate (DB + unit/integration + compliance smoke)
npm run test:all
# Expected: exit 0
```

### Database Schema Verification ✅

- [x] 22 core tables created
- [x] RLS policies on all tables
- [x] Tenant ID indexes on all tables
- [x] Foreign key indexes
- [x] Cash payment columns on bookings
- [x] `cash_reconciliations` table exists
- [x] Postgres identifiers in `snake_case`

### Environment Variables Verification 🟡

#### Required (Valid) ✅
- [x] `DATABASE_URL` — Neon pooled connection
- [x] `DATABASE_URL_UNPOOLED` — Neon direct connection
- [x] `HUB_TENANT_ID` — Valid UUID
- [x] `DEFAULT_PROPERTY_ID` — Valid UUID
- [x] `NEXTAUTH_SECRET` — Valid hash
- [x] `NEON_AUTH_BASE_URL` — Valid endpoint
- [x] `NEON_AUTH_JWKS_URL` — Valid JWKS endpoint
- [x] `ANTHROPIC_API_KEY` — Valid
- [x] `DEEPSEEK_API_KEY` — Valid
- [x] `GROQ_API_KEY` — Valid
- [x] `EMAIL_ADDRESS` — Valid
- [x] `EMAIL_PASSWORD` — Valid
- [x] `QDRANT_URL` — Valid
- [x] `QDRANT_API_KEY` — Valid
- [x] `NEXT_PUBLIC_POSTHOG_KEY` — Valid

#### RAG Configuration ✅
- [x] `QDRANT_URL` / `QDRANT_API_KEY` — Valid
- [x] `RAG_USE_QDRANT_INFERENCE=true` — Qdrant embeds at upsert/query (384d)
- [x] `QDRANT_INFERENCE_MODEL=intfloat/multilingual-e5-small`
- [x] `QDRANT_INFERENCE_DIMENSIONS=384`
- [x] `DEEPSEEK_API_KEY` — Sofia chat (primary)
- [x] `AI_PROVIDER_ORDER=deepseek,...` (not Anthropic-first)
- [x] `npm run rag:seed` — 27 points upserted to `buffr_rag`

#### Optional Placeholders (Non-Critical) ⚠️
- [ ] `OPENAI_API_KEY` — Placeholder (not required)
- [x] `NEXT_PUBLIC_STACK_*` — Placeholders ignored at runtime (`lib/auth/stack-env.ts`); set real keys from Stack dashboard or rely on NextAuth + optional Neon Auth

### Deployment Checklist

#### Pre-Deploy
- [ ] `npm run security:preflight` — 12/12 pass
- [ ] `npm run security:audit-api-coverage` — review legacy route list
- [ ] `npm run test:all` — exit 0
- [ ] Production build successful (`npm run build`)
- [ ] Environment variables configured in Vercel (`HUB_TENANT_ID`, `ETUNA_TENANT_ID`, auth, DB, RAG)
- [ ] Demo partner tenants disabled or removed in prod DB
- [ ] Database migrations applied on Neon (`npm run test:db:migrations`)

#### Deploy
```bash
npm run deploy:prod   # security:preflight + vercel --prod
# or: git push origin main  # when Vercel Git integration is linked
```

#### Post-Deploy
- [ ] `npm run compliance:production-smoke` (or §0 manual smoke on production URL)
- [ ] Check Vercel function logs for errors
- [ ] Check Neon database logs
- [ ] Monitor for 5xx errors in first hour
- [ ] Verify ISR revalidation working (5 min)

#### Vercel Environment Variables

**Required for Production:**
```bash
# Database
DATABASE_URL="postgresql://[pooled]"
DATABASE_URL_UNPOOLED="postgresql://[direct]"

# Tenant IDs
SINGLE_TENANT_MODE=false
HUB_TENANT_ID="c8cba92f-cbb1-4a79-b02f-d8d6d66b31a8"
ETUNA_TENANT_ID="c8cba92f-cbb1-4a79-b02f-d8d6d66b31a8"   # hub — security audit_trail for 401/403
DEFAULT_PROPERTY_ID="58d8c4ae-65e4-44f0-a70d-ec829a7a946a"

# Auth
NEXTAUTH_SECRET="[generate-secure-secret]"
NEON_AUTH_BASE_URL="[auth-url]"
NEXT_PUBLIC_NEON_AUTH_URL="[auth-url]"
NEON_AUTH_JWKS_URL="[jwks-url]"

# LLM (Sofia — DeepSeek primary)
AI_PROVIDER_ORDER="deepseek,openai,anthropic,llm"
DEEPSEEK_API_KEY="[key]"
DEEPSEEK_MODEL="deepseek-chat"
GROQ_API_KEY="[key]"  # optional fallback

# RAG (Qdrant Cloud Inference — 384d; DeepSeek is chat-only)
QDRANT_URL="[url]"
QDRANT_API_KEY="[key]"
RAG_USE_QDRANT_INFERENCE="true"
QDRANT_INFERENCE_MODEL="intfloat/multilingual-e5-small"
QDRANT_INFERENCE_DIMENSIONS="384"
RAG_ENABLED="true"

# Email
EMAIL_ADDRESS="[email]"
EMAIL_PASSWORD="[password]"
EMAIL_SMTP_HOST="[host]"
EMAIL_SMTP_PORT="465"

# Analytics
NEXT_PUBLIC_POSTHOG_KEY="[key]"
```

---

## UI/UX Design System (verified May 17, 2026)

**Brand reference:** PRD §9 (`khaki-600` CTAs, Playfair + Inter, 44px touch targets).

| Area | Verified | Notes |
|------|----------|-------|
| Gated copy | ✅ | `lib/copy/public.ts` (`gated`, `ctas`) used on public routes |
| Color palette | ✅ | No `text-gray-*` under `app/`; nude/khaki tokens |
| CTAs | ✅ | Guest surfaces use `Button` defaults / `btn btn-primary` |
| Component docs | ✅ | Button, Card, `ReviewCard`, `Skeleton` — top-of-file purpose comments |
| Register page | ✅ | Uses `Card` component pattern |
| Dashboard loading | ✅ | `components/shared/Skeleton.tsx`; dashboard skeleton states |
| Focus / a11y | ✅ | Khaki focus rings in `app/globals.css` |
| Remaining | 🟡 | Extract `RoomCard`; Sofia public chat copy polish |

**Overall:** ~96% design-system compliance — production-ready; remaining items are polish.

---

## Production Status

### Executive Summary

**Overall Status:** ✅ **95% Complete**

| Component | Status | Notes |
|-----------|--------|-------|
| Core Platform | ✅ 100% | All features operational |
| Database | ✅ 100% | Schema, RLS, seeding complete |
| Backend APIs | ✅ 100% | 183 route files; 119 on `withApiAuth`; 0 legacy session (May 18) |
| Frontend | ✅ 100% | ~61 pages compiled |
| Security | ✅ 100% | Preflight 12/12; RLS verified; finance/CRM on `withApiAuth` |
| Testing | ✅ 100% | `npm run test:all` green; 393/395 Vitest + 6 compliance smoke |
| Documentation | ✅ 100% | All docs updated |
| Sofia AI | ✅ 95% | RAG ingested (Qdrant Inference 384d); Mem0 optional for guest long-term memory |

### Phase Rollup

| Phase | Status | Details |
|-------|--------|---------|
| Phase 1 — Public pages | ✅ 100% | DB-driven landing, gated rates, partner pages |
| Phase 2 — Cash | ✅ 100% | Neon columns + payment UI + reconciliation |
| Phase 2a — NamQR desk | ✅ Shipped | NamQR v5, desk UI, manual payments, **manual** bank recon |
| Phase 2b — Adumo Virtual | **Partial** | Code + Neon `0012`; **staging/live Adumo smoke pending** |
| Phase 2c — Buffr platform billing | **Shipped** | Accrual, draft/issue, HTML/CSV export, mark-paid, fee schedule API |
| Phase 2d — F&B inventory | **Partial** | `0011` + alerts UI on Neon; manual low-stock QA only |
| Phase 3 — PWA / offline | ✅ 100% | Manifest, SW, offline routes |
| Phase 4 — Session timeout | ✅ 100% | Auto-logout on inactivity |
| Phase 5 — Sofia / RAG | ✅ 100% | Qdrant Inference 384d; 27 chunks ingested |
| Phase 6 — Tests | ✅ 100% | `test:all` gate; 393/395 Vitest; E2E via Playwright (separate) |
| Phase 7 — Docs | ✅ 100% | All project docs complete |

### What's Working Right Now

| Feature | Status | URL |
|---------|--------|-----|
| Public Website | ✅ Live | `/` |
| Room Listings | ✅ Live | `/rooms` — filmstrip + photo tours; browse without login |
| Room Detail Tour | ✅ Live | `/rooms/[slug]#tour` — `RoomPhotoTour`, gated booking card |
| Restaurant Menu | ✅ Live | `/dining` — full menu, single-page UX (2×3 grid), Previous/Next |
| Admin Dashboard | ✅ Live | `/dashboard` |
| Partner Portal | ✅ Live | `/partner/dashboard` |
| Booking System | ✅ Live | Create/manage bookings |
| Cash Payments | ✅ Live | Mark paid + receipts |
| Reconciliation | ✅ Live | Date filter + discrepancy |
| Review Approval | ✅ Live | Toggle `is_public` in CRM |
| Sofia AI Chat | ✅ Live | RAG on when `RAG_ENABLED=true` + Qdrant configured |

### Known Issues & Blockers

#### RAG maintenance

Re-run `npm run rag:seed` after editing `data/hotel-etuna-knowledge/*.md`. Conversations are **not** stored in Qdrant (see `PLANNING.md` § Sofia memory vs Ava) — only property knowledge in `buffr_rag`.

**Verification After Ingestion:**
```bash
# Check collection was created
curl -H "api-key: $QDRANT_API_KEY" \
  "$QDRANT_URL/collections/buffr_rag"

# Test Sofia with RAG-enabled question
# "What does Etuna mean?"
# Expected: Answer includes "He Takes Care of Us" from knowledge base
```

#### ⚠️ NON-BLOCKING: Service Duplication (RESOLVED ✅)

**Status:** No duplication found - already resolved

**Fraud Detection Service:**
- Only `lib/services/fraud/FraudDetectionService.ts` exists (33KB, Drizzle, comprehensive)
- `lib/services/security/FraudDetectionService.ts` does not exist
- No consolidation needed

**Menu Service:**
- Only `lib/services/menu/MenuService.ts` exists (17KB, comprehensive)
- `lib/services/restaurant/MenuService.ts` does not exist
- No consolidation needed

**Impact:** None - false alarm in tracking

#### ⚠️ NON-BLOCKING: npm audit (dependency backlog)

**Status (May 17, 2026):** **0 critical** after `package.json` overrides. Triage snapshot: **5 high / 7 moderate** — `npm run security:audit-triage` → `compliance/evidence/security/npm-audit-triage-2026-05-17.json`. Risk-accept dev-only chains (e.g. `elliptic` via Stack) on monthly cadence.

**Impact:** Does not block deploy when critical gate passes.

#### ✅ Legacy API auth (closed May 18)

**Status:** `bookings/[id]/payment` → `withApiAuth`; `bookings/availability` → public + optional `getAuthenticatedUser` for rate gating. **`npm run security:audit-api-coverage`** → **0** legacy routes.

**Impact:** Covered by session + business rules; not in finance/compliance blast radius.

#### ⚠️ LOW PRIORITY: Scripts Cleanup (COMPLETED ✅)

- Moved ~35 ad-hoc utility scripts to `scripts/archive/`
- Kept only production-ready scripts in root `scripts/`
- Created comprehensive `scripts/README.md` with usage documentation
- Production scripts:
  - `seed-hotel-etuna.ts` - Main seeding
  - `provision-platform-admin.ts` - Buffr `@buffr.ai` super-admin upsert
  - `seed-partners.ts` - Partner seeding
  - `ingest-hotel-etuna-knowledge.ts` - RAG ingestion
  - `verify-system-design.js` - System verification
  - `clean-dev-cache.mjs` - Dev cache cleanup
  - `db/` - Database management

### Seeded Data Summary

#### Hub Tenant (Hotel Etuna)
- **Tenant ID:** `c8cba92f-cbb1-4a79-b02f-d8d6d66b31a8`
- **Property:** Hotel Etuna (Ongwediva, Namibia)
- **Rooms:** 5 types (Standard, Luxury, Family, Executive Suite, Premier)
- **Restaurant:** Etuna Restaurant
- **Menu:** 5 categories, 16 items
- **Hotel admin:** manager@hoteletuna.com / `owner` / Test1234! (seed script)
- **Buffr platform admin:** george@buffr.ai / `super-admin` / `is_platform_admin` — provision via `scripts/provision-platform-admin.ts` (password from `ADMIN_PASSWORD` env, not committed)

#### Partner Tenants
- **Note:** Partner seed script (`scripts/seed-partners.ts`) requires `PARTNER_SEED_PASSWORD` environment variable.

**JayLa Self Catering (Windhoek)**
- **Tenant ID:** `68b9ab31-750f-4bd8-a1e2c9d00a16`
- **Property:** JayLa (39 Andimba Toivo ya Toivo Street)
- **Admin:** owner@jayla.nam / Test1234!
- **Commission:** 10%

**Aquarius Luxurious Penthouse (Windhoek)**
- **Tenant ID:** `bf0c8118-8313-48ab-96fa-0544e7cbd7fb`
- **Property:** Aquarius (Kingfisher Street)
- **Rooms:** 1 double room
- **Admin:** owner@aquarius.nam / Test1234!
- **Commission:** 10%

### User Journey Testing

#### 1. Guest Booking Journey ✅
- [x] Visit landing page
- [x] Browse rooms
- [x] View room details
- [x] Initiate booking
- [x] Fill guest details
- [x] Confirm booking
- [x] Receive confirmation email

#### 2. Guest Uses Sofia AI 🟡
- [x] Visit landing page
- [x] Click Sofia chat widget
- [x] Ask question
- [ ] Sofia responds with hotel knowledge (RAG blocked)
- [x] Escalation to human works

#### 3. Hotel Admin Manages Bookings ✅
- [x] Log in as admin
- [x] View dashboard with overview
- [x] View bookings list
- [x] Change booking status (confirmed → checked-in → checked-out)
- [x] Check audit log
- [x] RLS enforces hub-only data

#### 4. Admin Invites Partner ✅
- [x] Navigate to partner management
- [x] Send invite email
- [x] Partner clicks claim link
- [x] Partner account created
- [x] Partner can log in

#### 5. Partner Self-Service ✅
- [x] Partner logs in
- [x] View partner dashboard (limited access)
- [x] Update property details
- [x] Add/edit rooms
- [x] View own bookings only
- [x] Cannot access Sofia/CRM/AI features

#### 6. Public Partner Page ✅
- [x] Visit `/partners/[slug]`
- [x] View partner property info
- [x] View available rooms
- [x] Initiate booking
- [x] Booking stored with correct tenant_id

### Compliance Status

#### PSD-12 Requirements
- [x] 2FA enforced on payment endpoints
- [ ] Strong Customer Authentication (SCA) flow
- [ ] Payment incident reporting

#### Data Protection
- [x] Tenant isolation via RLS
- [ ] Guest consent management (GDPR)
- [ ] Data retention policies
- [ ] Right to erasure implementation

#### BoN Open Banking
- [x] API participant ID updated
- [ ] mTLS certificate authentication
- [ ] API transaction logging
- [ ] Performance monitoring (<300ms)

---

## Troubleshooting

### Landing Page Shows Stale Data
**Solution:** Wait 5 minutes for ISR revalidation, or force:
```typescript
revalidatePath('/');
```

### 401 Unauthorized on API Routes
**Solution:** Ensure logged in with valid session cookie; protected staff routes expect `withApiAuth` session + role. Check `compliance/evidence/security/api-coverage-*.json` if the route was recently migrated.

### 403 on finance / recon / CRM APIs
**Solution:** Role must be `owner`, `manager`, or `admin` (bank recon) or include `staff` where documented. Confirm `tenant_id` on the user session matches hub/partner context.

### 403 Forbidden on Review Toggle
**Solution:** Check user role is `owner`, `manager`, or `admin`

### Reviews Not Appearing After Approval
**Solution:** Wait 5 minutes for cache, or reduce ISR time:
```typescript
export const revalidate = 60; // 1 minute
```

### Menu Items Not Showing
**Solution:** Check `cms_menu_items.is_available = true` in database

### Menu Images Missing or Broken
**Solution:**
1. Run `npm run validate:menu-images` (HTTP check on `image_url` values)
2. Run `npm run seed:menu-images:full` to backfill from `lib/data/menu-item-image-urls.ts`
3. Confirm `next.config.ts` allows `images.unsplash.com` and `upload.wikimedia.org`

### Deployment Fails

1. **Check Environment Variables:**
   ```bash
   vercel env ls
   ```

2. **Verify Database Connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Check Build Logs:**
   ```bash
   vercel logs [deployment-url]
   ```

4. **Test Locally:**
   ```bash
   npm run build && npm start
   ```

---

## Related Documentation

- **System design (full):** `SYSTEM_DESIGN_MASTER_GUIDE.md` (repo root)
- **Product:** `docs/project/PRD.md` (§6.6, §4.3.2, §11.5–11.6)
- **Architecture:** `docs/project/PLANNING.md` (principles, caching, API, security)
- **Security onboarding:** `docs/SECURITY_DEV_ONBOARDING.md` · `docs/SECURITY_PROMPT_PACK.md` §15
- **Compliance evidence:** `docs/compliance/EVIDENCE_CALENDAR.md` · `compliance/evidence/security/`
- **Implementation:** `PLANNING.md` § Implementation sequence
- **Testing:** `TASK.md` § Production smoke, § Testing Procedures (`npm run test:all`, `test:db`, `test:db:migrations`)
- **Migration / DB:** `PLANNING.md` § Database design
- **Partner network:** `PRD.md` §2.2 · `PLANNING.md` § Partner hub-and-spoke
- **Production status:** `TASK.md` § Production status

---

## Next Review

- After Adumo staging card sign-off + live credentials (§ Phase 2b)
- Monthly: `npm run compliance:monthly-evidence` + `security:audit-triage`

---

**Last Verified:** May 17, 2026 (security preflight + API coverage audit — see § Deployment Pre-Flight + § Verified Implementation Audit)  
**Deployment Status:** ✅ Production Live — run `npm run deploy:prod` to ship latest (e.g. `/tours` 404, security route migrations)
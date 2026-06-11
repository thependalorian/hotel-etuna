# Codebase Health Audit — 2026-06-10

**Project:** Hotel Etuna (`hotel-etuna/`)  
**Stack:** Next.js 16 App Router, TypeScript, Drizzle ORM, Neon PostgreSQL, Tailwind 4 + daisyUI 5  
**Auditor:** Automated codebase health pass (schema, tree, docs, dead code, DRY, JSDoc, wiring)

---

## Executive summary

The codebase is **production-shaped and well-structured** (domain folders, 194 API routes, ~113 pages, 113 Drizzle tables). This audit removed **~45 confirmed-dead files**, fixed a **dual-auth bug** on room availability, added **@fileoverview JSDoc** to 26 lib modules, and aligned docs with reality.

**Verification:** `npm run verify:production` → **green** (2026-06-11: **808** Vitest + **6** smoke + `next build`). `npm run validate:audit-wave6` → **9 pass**, 1 warn. PostHog MCP project **341765**: low-volume errors only (see §11.4).

---

## 1. Database schema

| Item | Finding |
|------|---------|
| **Schema** | `lib/db/schema.ts` (~3,666 lines, **113** `pgTable` definitions) |
| **Migrations** | `database/drizzle/*.sql` — **55** numbered SQL files + `meta/_journal.json` |
| **Journal** | **55 entries**, idx 0–54 contiguous; tags match on-disk `.sql` files |
| **Gaps in numbering** | `0022`–`0028`, `0030`, `0032`, `0034`, `0058`–`0059` intentionally skipped (landed as `0029+`, `0060+`) — **do not renumber** applied Neon migrations |
| **Drizzle config** | `drizzle.config.ts` → schema `./lib/db/schema.ts`, out `./database/drizzle` |
| **RLS** | Tenant RLS policies in migrations `0004`, `0006`, `0010`, `0015`, `0029b`, `0031b`, `0033b` |
| **Orphan tables** | No tables found in SQL without a Drizzle counterpart; no unused tables flagged without deeper query-tracing |

**Notable schema domains:** bookings/folio (`booking_charges`, `0060` deposit %), payments (Adumo sessions, outbox, disputes), guest hub (magic tokens, document vault), payroll (`0056`–`0057`), compliance (audit hash chain `0047`, accounting period locks `0048`), Sofia (`0052` pipeline runs), Cal mirrors (`0053`), housekeeping, dining, loyalty, CMS, introducer partners.

---

## 2. Project architecture (mental model)

```
Browser → proxy.ts (edge RBAC, rate limits, tenant isolation)
       → app/**/page.tsx (RSC + client islands)
       → fetch /api/* → app/api/**/route.ts
       → withApiAuth / withTenantApiAuth (lib/utils/api-helpers.ts)
       → lib/services/<domain>/* → Drizzle (lib/db) + Neon
```

| Layer | Scale | Notes |
|-------|-------|-------|
| `app/api/` | 194 route handlers | 86 use `withApiAuth`; 41 partial `api-helpers`; 65 alternate auth (cron, webhooks, public, platform-admin) |
| `components/` | ~240 `.tsx` after cleanup | `ui/`, `features/<domain>/`, live landing: `NavigationHeader` + `LandingBookingWidget` only |
| `lib/services/` | 80+ domain services | Booking, folio, payments, fraud, Sofia, compliance, restaurant, payroll, etc. |
| `tests/` | 100 Vitest files | unit + integration + smoke |
| `e2e/` | 11 Playwright specs | public homepage, auth, responsive |

**Auth:** Dual Stack Auth (primary) + NextAuth session fallback via `getAuthenticatedUser` in `api-helpers`.

---

## 3. Product goals (from PRD / PLANNING / TASK)

**Mission:** Multi-tenant hospitality platform for Hotel Etuna (hub) + partner properties — bookings, in-stay folio, F&B, Sofia AI concierge, payments (Adumo/NamQR), compliance (PSD-12, SOC 2 Type I readiness).

**Target users:** Guests (public + guest hub), hotel staff (dashboard), partners (self-service portal), platform admins (Buffr Hub).

| Status | Features |
|--------|----------|
| **Live / built** | Public marketing (DB-driven homepage), room booking, guest hub, staff dashboard, folio/charges, Adumo virtual payments, restaurant/QR, loyalty, CRM, fraud alerts, housekeeping, payroll core, platform billing, Sofia chat, compliance evidence tooling |
| **In progress** | SOC 2 operator gates (pgAudit, MFA screenshots, vendor attestations), Adumo staging validation |
| **Deferred / partial** | BoN AIS account routes, notification dispatch wiring, full API middleware standardization |

---

## 4. Fixes applied in this audit

### 4.1 Dead code removed (~45 files)

**Orphan components (24):**  
`PostHogPageView`, `AlertDetailModal`, `MenuBookFaceRenderer`, `PublicMenuBoard`, `PlatformAdminNavbar`, `PlatformAnalytics`, `AuditLogs`, analytics charts/widgets, `NewBookingPage`, `PreviewPanel`, `CreatePropertyForm`, property/rooms `RoomCard`, restaurant `OrderForm`/`QRCodeGenerator`, rooms filters/stats, staff chart/card, `PartnerHeader`, `ScrollProgress`.

**Legacy landing sections (20):**  
All `components/sections/landing/*` except `NavigationHeader.tsx` and `LandingBookingWidget.tsx` (homepage is inline DB-driven JSX in `app/page.tsx`).

**Empty lib stubs (7):**  
`lib/utils/formatting.ts`, `lib/utils/date.ts`, empty `*Service.ts` in booking/analytics/staff/cms.

**Unused types (3):**  
`lib/types/booking.ts`, `property.ts`, `staff.ts`.

**Legacy / duplicate (3):**  
`lib/auth/middleware.ts` (superseded by `proxy.ts`), `lib/services/compliance/Soc2AuditService.ts` (facade; orchestrator used directly), `lib/services/sofia/SofiaConciergeService.ts` (0-byte stub; canonical is `lib/services/ai/SofiaConciergeService.ts`).

**Scripts:**  
`scripts/archive/db/` (6 one-off migration scripts) — removed per `scripts/README.md` policy; recoverable via git history.

### 4.2 DRY / Boy Scout

| Change | File(s) |
|--------|---------|
| **Dual-auth fix** | `app/api/bookings/availability/route.ts` — `getServerSession` → `getAuthenticatedUser(request)` so Stack Auth users receive gated rates |
| **NamQR disambiguation** | Cross-reference JSDoc on `lib/services/qr/NAMQRService.ts` vs `lib/services/openbanking/NamQRService.ts` |
| **Locale consistency** | `FraudAlertsTable.tsx` — `en-US` → `en-NA` for date formatting |
| **E2E test names** | `e2e/public-components.spec.ts` — renamed tests that referenced deleted landing components |

### 4.3 JSDoc / @fileoverview

Added top-of-file documentation to **26** lib modules that lacked it, including: `BookingService`, `GuestService`, `SofiaConciergeService`, `api-helpers` consumers (`auth/config`, `errors`, `validation`, domain types), and NamQR services.

### 4.4 Documentation alignment

| Doc | Update |
|-----|--------|
| `docs/project/PLANNING.md` | `NotificationDispatchService` marked as implemented but **not yet wired** |
| `docs/project/TASK.md` | New audit section + archive deletion note |
| `e2e/public-components.spec.ts` | Comments reflect DB-driven homepage |

---

## 5. Remaining issues (human / follow-up)

### Critical / product gaps

| Issue | Evidence | Action |
|-------|----------|--------|
| ~~NotificationDispatchService unwired~~ | **Fixed 2026-06-10** — check-in reminders, partner digest, `notification-dispatch` scheduler handler | — |
| **BoN AIS routes** (deferred) | `AccountInformationService` has no `app/api/bon/v1/banking/accounts/*` routes; sandbox payments exist at `/api/bon/v1/banking/payments` | Revisit when open-banking AIS stream is prioritised — not launch-blocking |
| **Adumo live credentials** | `compliance/evidence/payments/ADUMO_STAGING_VALIDATION_2026-06-10.md` | Operator: complete staging validation |

### Tech debt (non-blocking)

| Issue | Count / detail |
|-------|----------------|
| API routes without `api-helpers` | **~6** intentional exceptions remain (`sofia/chat`, Adumo callbacks, public webhooks) after C9 wave |
| `SofiaConciergeService` size | **925** lines after D1 partial split (`sofia-intent.ts`) |
| Inline date formatters | 5 components/pages duplicate `lib/formatters.ts` patterns |
| ~~`CLAUDE.md` migration doc path~~ | **Fixed** — points to `docs/project/MIGRATION_MASTER.md` (through `0064` `generated_documents`) |
| Guest financial PDFs | **Shipped 2026-06** — `DocumentGenerationService`, migration `0064`, staff/guest UI, lifecycle email hooks, Sofia `resendGuestDocument`, inbox routing |
| `components/ui/Textarea.tsx` | Exported from barrel but no consumers — keep for design system completeness |

### Compliance / operator gates (from TASK.md)

- IMP-01: pgAudit on Neon  
- IMP-04: Org-wide MFA screenshots  
- IMP-05: Vendor SOC attestations  
- IMP-06: Production retention dry-run evidence  

### Tests

- ~~**2 Sofia timeouts**~~ — **Fixed 2026-06-10** via mocked LLM/email in `sofia-chat.test.ts`.

---

## 6. API middleware coverage snapshot

| Pattern | Routes | % |
|---------|--------|---|
| `withApiAuth` / `withPlatformApiAuth` | ~105 | ~54% |
| Partial `api-helpers` (optional-auth public) | ~35 | ~18% |
| Intentional alternate (cron, webhooks, public, BoN, auth) | 44 | 23% |
| Hand-roll refactor candidates | ~8 | ~4% |

**2026-06-10 batch:** Migrated 19 staff/CRM/payments/inventory/admin routes from hand-rolled `getServerSession` / `getAuthenticatedUser` to `withPlatformApiAuth` + `errorResponse`/`successResponse`. Cash payment route now inserts a completed `transactions` row and passes `transactionId` to `schedulePaymentReceiptEmail`. **Intentional exceptions:** `bookings/availability` (optional-auth rate gating), `dining/favourites` (returns `{ items: [] }` when anonymous), `compliance/kyc/upgrade-prompts` GET (public).

---

## 7. Files modified (summary)

**Deleted:** ~45 files (see §4.1)  
**Edited:** `app/api/bookings/availability/route.ts`, `e2e/public-components.spec.ts`, `components/features/fraud/FraudAlertsTable.tsx`, NamQR service headers, 26 lib `@fileoverview` headers, `docs/project/PLANNING.md`, `docs/project/TASK.md`

---

## 8. Recommended next steps

1. ~~Wire `NotificationDispatchService`~~ — done (reminders, partner digest, scheduler handler).  
2. ~~Batch-migrate hand-roll API routes~~ — **19-route batch done 2026-06-10**; intentional optional-auth exceptions documented in §11.2 (not IDOR gaps).  
3. ~~Stabilize Sofia email-intent tests~~ — done.  
4. ~~Migration doc pointer~~ — `docs/project/MIGRATION_MASTER.md` updated; `CLAUDE.md` path fixed.  
5. ~~Re-run `npm run test:ci`~~ — includes `validate:document-wiring` for guest financial PDFs (2026-06-10).  
6. Operator gates: Adumo staging validation, pgAudit, MFA screenshots, vendor SOC attestations (non-code).  
7. ~~Guest financial PDF smoke~~ — `npm run validate:document-wiring` + `tests/integration/documents-*.test.ts`.

---

---

## 9. Refactor execution log (2026-06-11)

| Item | Status | Notes |
|------|--------|-------|
| A1 Night Audit VAT | ✅ | `computeNightAuditTariffCharges` in `namibia-tax.ts`; `NightAuditService` uses profile-aware VAT + NTB levy |
| A2 NamQR confirm guard | ✅ (pre-existing) | `checkNamQrSettlement` + `assertQrMatchesSettlement`; tests in `namqr-settlement-recheck.test.ts` |
| C2 Cron auth DRY | ✅ | `lib/utils/cron-auth.ts`; 7 cron routes updated |
| F1 `HOTEL_ETUNA_OS.md` | ✅ | Created at `docs/project/HOTEL_ETUNA_OS.md` |
| TASK.md W5 duplicate | ✅ | Removed duplicate checklist block |
| Archon tasks API | ⚠️ | `manage_task` fails — `priority` column missing on `archon_tasks`; tracked via this log |
| C1 Platform admin auth | ✅ | `lib/auth/with-platform-admin-auth.ts`; all 17 `app/api/admin/platform/**` routes migrated |
| C3 NamQR constants | ✅ | `namqr-core.ts` re-exports from `lib/compliance/namqr/standards.ts` |
| C5 NamQR UI dedup | ✅ | `NamQrQrDisplay`, `NamQrSettlementNote`, `NamQrAmountField`, `NamQrBankReferenceField`; desk + guest panels |
| C4 `money.ts` | ✅ | `lib/utils/money.ts` (`toNumber`, `roundMoney`, `formatFolioAmount`); 7 services consolidated |
| C6 Sofia shell | ✅ | `SofiaChatMessagePane`, `SofiaChatInputRow`, `useSofiaAutoScroll`, `SofiaTypingIndicator`, shared types; all 3 chat UIs |
| C7 Folio dedup | ✅ | `FolioBalanceStat`, `FolioLinesTable`, `FolioPartialAmountField`, `FolioCashCardPayRow`, `resolveFolioPayAmount` |
| E1 formatters | ✅ | `lib/formatters.ts` canonical (`formatDateLong`, `formatTime`, `formatNumber`, `formatCurrencyNAD`); audit call sites migrated |
| C9 API auth | ✅ | `withTenantApiAuth` in `api-helpers.ts`; 25 routes migrated (23 tenant + 2 CMS); 0 `requireTenantSessionUser` under `app/api` |
| C8 SOC2 paths | ✅ | `resolveSoc2PeriodFromSearchParams`; `Soc2ComplianceService` → `runSoc2Audit`; platform admin route shares period parser |
| D1 Sofia split | ✅ | `sofia-intent.ts`, `sofia-conversation-store.ts` (~260 LOC), `sofia-email-automation.ts` (~138 LOC); `SofiaConciergeService` **578** LOC (was 1,160) |
| B1 dormant AML PEP | ✅ | Schema JSDoc on `aml_pep_database` / `aml_guest_pep_flags`; tables retained, documented out-of-scope |
| B2 deprecated SOC2 CLI | ✅ | `scripts/compliance/soc2-audit.ts` forwards to `scripts/soc2/collect-evidence.ts` |
| B3 SOC2 catalog shim | ✅ | `lib/compliance/soc2/control-catalog.ts` intentional re-export (documented in `docs/compliance/README.md`) |

### Validation (2026-06-11)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| NamQR + night-audit + SOC2 unit tests | ✅ 35/35 (`namqr-v5`, `namqr-payment-flow`, `namibia-hospitality-accounting`, `namqr-settlement-recheck`, `soc2-audit`) |
| C1 — no hand-roll admin auth | ✅ 0 matches for `getCurrentPlatformAdmin` / `requirePlatformAdmin` under `app/api/admin/platform/**` |
| C3 — NamQR constants | ✅ `lib/compliance/namqr/standards.ts` canonical; `namqr-core.ts` re-exports (`516`, `7011`, `5812`) |
| C5 — shared UI | ✅ `NamQrQrDisplay.tsx`, `NamQrSettlementNote.tsx` used by desk + guest panels |
| C4 — money helpers | ✅ Single `lib/utils/money.ts`; no duplicate `toNumber`/`roundMoney` in tax/folio/accounting |
| C5/C6/C7 — shared UI | ✅ NamQR fields, Sofia shell stack, folio settlement primitives |
| E1 — formatter sweep | ✅ No remaining audit-flagged `en-US` / inline currency on folio-facing UI |

**DRY/KISS backlog (waves 1–5):** complete for tracked items A1–E1, C1–C9, D1, B1–B3.

---

## 11. Security Prompt Pack execution (2026-06-11)

**Framework:** `docs/SECURITY_PROMPT_PACK.md` (Gaps 1–15) + `npm run security:preflight`  
**Evidence:** `compliance/evidence/security/preflight-2026-06-11.json` (12/12 static checks pass, **100%**)

### Gap-by-gap review

| Gap | Topic | Status | Finding / action |
|-----|-------|--------|------------------|
| 1 | Backend validation | ✅ Pass | Money paths use Zod (`bookings/route.ts`, `payment-security`, CRM, guest orders). Drizzle parameterizes all DB access. |
| 2 | Hardcoded secrets | ✅ Pass | PF-02 clean; secrets via `process.env`; `.env` gitignored. Test keys only in `tests/` and `e2e/`. |
| 3 | Auth & sessions | ✅ Pass | Stack Auth + NextAuth via `getAuthenticatedUser`; `withApiAuth` / `withTenantApiAuth`; debug route 404 in production. |
| 4 | Permission checks | ✅ Fixed | **IDOR:** `GET /api/compliance/psd/payment-security` and `bon-incident` previously accepted arbitrary `tenantId` query — now `withTenantApiAuth` + session `tenantId`. Guest hub routes verify booking ownership. |
| 5 | Error messages | ✅ Pass | `sanitizeErrorDetails` in `api-helpers`; production 500s generic. |
| 6 | Injection (SQL/XSS/CSRF) | ✅ Pass | No raw SQL concatenation with user input; `sanitize-html.ts` + PF-06-xss pass; state changes use SameSite session cookies. **CSP:** `lib/security/content-security-policy.ts` + `vercel.json` + `proxy.ts` (2026-06-11). |
| 7 | File uploads | ✅ Pass | `createCmsMediaSchema` — MIME whitelist, 5MB cap (PF-11-upload). |
| 8 | Rate limiting | ✅ Pass | `lib/utils/rate-limit.ts` covers auth, payments/virtual, guest/stays; `withApiAuth` applies limits by default. |
| 9 | HTTPS & headers | ✅ Improved | `vercel.json`: X-Content-Type-Options, X-Frame-Options, Referrer-Policy; **added** HSTS + Permissions-Policy (2026-06-11). |
| 10 | PII handling | ✅ Pass | Guest DSAR route; audit trail; no production PII in test fixtures committed. |
| 11 | Insecure config | ✅ Pass | No CORS `*` on API routes; debug guarded; `NODE_ENV=production` on Vercel. |
| 12 | Dependencies | ⚠️ Watch | `npm audit`: **0 critical**, 1 high, 16 moderate. **Dependabot** enabled (`.github/dependabot.yml`); evidence `compliance/evidence/security/npm-audit-2026-06-11.json`; CI `npm run security:audit-report`. No `audit fix --force`. |
| 13 | Logging & audit | ✅ Fixed | **76** `app/api/**` routes migrated off `security-logger.client` (no-op) → `security-logger` (server audit path). `record-audit.ts` + `audit_trail` present. **Follow-up:** automated alert rules (§13.2) still operator/Sentry config. |
| 14 | Master review | ✅ Pass | Second pass after fixes; no new blockers on payment/compliance paths touched in C9. |
| 15 | Deployment pre-flight | ✅ Pass | Automated preflight 100%; evidence JSON written. |

### Fixes applied this pass

| Change | Files | Gap |
|--------|-------|-----|
| Server security logging on all API routes | 76 × `app/api/**/*.ts` | 13 |
| PSD stats dashboards require session tenant | `compliance/psd/payment-security`, `bon-incident` GET | 4 |
| HSTS + Permissions-Policy headers | `vercel.json` | 9 |
| Replace `console.error` in API route | `app/api/dining/favourites/route.ts` | 13 |
| Canonical CSP (PostHog, Stack Auth, Turnstile, Adumo) | `lib/security/content-security-policy.ts`, `lib/security/security-headers.ts`, `vercel.json`, `proxy.ts` | 6, 9 |

### Open security follow-ups (non-blocking)

1. ~~**CSP**~~ — done 2026-06-11 (`content-security-policy.ts`; sync `PRODUCTION_CSP_HEADER` if `NEXT_PUBLIC_POSTHOG_HOST` is non-US).  
2. ~~**npm audit cadence**~~ — Dependabot + `security:audit-report` evidence (2026-06-11); LangChain major bump deferred.  
3. **Operator gates** — see §11.2 (pgAudit, MFA screenshots, Adumo production sign-off).  
4. ~~**RLS dry-run**~~ — ✅ `npm run test:db:rls` passed 2026-06-11 (§11.1); re-run before major releases.

### §11.1 RLS verification

| Run | Result | Notes |
|-----|--------|-------|
| `npm run test:db:rls` (2026-06-11) | ✅ Pass | Hub/partner isolation, cross-tenant insert denied; ephemeral `rls_verify_*` role cleaned up |

### §11.2 Operator gates & intentional API exceptions

| Gate / route | Status | Evidence / rationale |
|--------------|--------|----------------------|
| IMP-01 pgAudit on Neon | ✅ Compensating | \`npm run verify:pgaudit\` → \`compensatingControls: true\`; Neon extension blocked (\`42501\`) — app \`audit_trail\` + preflight evidence |
| IMP-04 Adumo Virtual staging | ✅ Local | `npm run validate:adumo` — staging `initialisevirtual` OK; `adumo-virtual-validation-2026-06-11.json` |
| IMP-04 Adumo production sign-off | ⏸️ Operator | Live `ADUMO_BASE_URL` + portal URLs on Vercel + BoN evidence |
| IMP-05 Org MFA screenshots | ⏸️ Operator | Stack Auth org policy — attach to SOC2 evidence folder |
| `GET /api/dining/favourites` | ✅ By design | Optional auth — anonymous → `{ items: [] }` |
| `GET/POST /api/bookings/availability` | ✅ By design | Public availability; rates gated via `getAuthenticatedUser` |
| `POST /api/sofia/chat`, `/api/public/sofia/chat` | ✅ By design | Session/rate-limit at route layer; streaming LLM |
| `POST /api/webhooks/adumo` | ✅ By design | HMAC `x-adumo-signature`; no session auth |
| CMS public reads | ✅ Migrated | C9 batch included CMS routes where tenant-scoped |

### §11.3 Wave 6 execute + validate (2026-06-11)

**Command:** `npm run validate:audit-wave6`  
**Evidence:** `compliance/evidence/security/audit-wave6-validation-2026-06-11.json`

| Step | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ |
| `npm run security:preflight` | ✅ 12/12 |
| `npm run security:audit-report` | ✅ (0 critical, 1 high, 16 moderate) |
| `npm run test:db:rls` | ✅ |
| `npm run validate:adumo` | ✅ staging |
| `npm run enable:pgaudit` | ⚠️ `permission denied to create extension "pgaudit"` — expected on Neon without platform enablement |
| `npm run verify:pgaudit` | ✅ `status: "compensating"`, `compensatingControls: true` (app audit trail + security preflight) |
| CSP + Sofia + NamQR/SOC2 unit tests | ✅ 48 tests |

**Verdict:** Code + security gates **green**; IMP-01 closed via **compensating controls** (Neon pgAudit requires platform/HIPAA path — not app code).

### §11.4 Production readiness + PostHog MCP (2026-06-11)

**Commands run:** `npm run verify:production`, `npm run validate:audit-wave6`, `npm run security:preflight`, PostHog MCP (`project-get`, `query-error-tracking-issues-list`, `query-trends`).

| Gate | Result |
|------|--------|
| `verify:production` | ✅ **107** Vitest files, **808** passed, **2** skipped; smoke **6/6**; `next build` green |
| `validate:audit-wave6` | ✅ **9 pass**, 1 warn (`enable:pgaudit` Neon `42501`), 0 fail |
| `verify:pgaudit` | ✅ `status: "compensating"`, `compensatingControls: true` |
| `security:preflight` | ✅ **12/12**, 100% |
| Code fix | ✅ `SofiaConciergeService.getConversationHistory()` → `SofiaConversationStore` |

**PostHog (project 341765, US cloud):**

| Signal | 30-day snapshot |
|--------|-----------------|
| `$pageview` (weekly) | 44 → 78 → 44 → 20 → 27 (localhost filtered) |
| `$exception` (weekly) | 0 → 3 → 0 → 3 → 0 |
| Active error issues | **4** — 2× ChunkLoadError (stale deploy chunks), 1× RSC production digest, 1× TypeError “Load failed” |
| Session replay | Off (`session_recording_opt_in: false`) |

**Operator actions before deploy:** `npm run verify:production` on release branch; confirm Vercel env (`NEXT_PUBLIC_POSTHOG_*`, `DATABASE_URL`, live `ADUMO_*` when IMP-04 signed). After deploy: spot-check PostHog error tracking for ChunkLoad spikes (hard refresh / cache bust).

---

## 10. Archon tracking (tasks API unavailable)

**Project:** Hotel Etuna — Content & Brand OS (`9ee6b16d-837d-444a-af2d-b49584ee19ec`)

| Tool | Status | Use instead |
|------|--------|-------------|
| `manage_task` / `find_tasks` | ❌ Broken (schema `priority` column / 500 timeout) | Archon **project documents** + this §9 log |
| `manage_document` | ✅ | Execution note + guide (search `find_documents(project_id=…, query=audit)`) |
| `rag_search_knowledge_base` | ⚠️ Empty for hotel-etuna until re-sync | Run `scripts/archon/sync-content-knowledge.sh` after audit doc changes |

**Canonical repo log:** this file §9. **Archon mirror:** document `DRY/KISS Audit Execution — 2026-06-11` + guide `DRY/KISS Audit — Validation & Archon Workflow`.

*Generated 2026-06-10; Security Prompt Pack §11 added 2026-06-11; Production verification §11.4 added 2026-06-11. Re-run `npm run verify:production` before each production deploy.*

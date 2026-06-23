# Hotel Etuna — Production Planning

**Last Updated:** June 8, 2026 (Agentic CRM & Intelligent OS roadmap, Phases 8–12, + guardrails — see § Agentic CRM & Intelligent OS roadmap)  
**Program Status:** Phases 1–5 complete (RAG ingested via Qdrant Inference 384d); Phases 6–7 complete; workflow YAML tests aligned with `ci.yml` / `deploy.yml` (May 17, 2026)  
**Product scope:** Curated **tours** removed from public site and Sofia KB (PRD v2.7.2+). No `/tours` route; four markdown sources under `data/hotel-etuna-knowledge/`.

---

## Program Objective

Ship Hotel Etuna to full daily-operations readiness on Vercel + Neon with:
- Database-driven public pages
- Authenticated gated pricing/booking flow
- Cash payment and reconciliation workflow
- Offline/PWA resilience
- Secure session handling
- Verified AI knowledge ingestion
- Stable test + deployment pipeline

---

## Architecture Decisions

### Platform Stack

- **Database:** Neon PostgreSQL + Drizzle ORM (migrated from Supabase)
- **Deployment:** Vercel (serverless Next.js 15)
- **AI/RAG:** Qdrant Cloud Inference (`intfloat/multilingual-e5-small`, **384d**) for knowledge retrieval; DeepSeek for chat only
- **LLM Router:** DeepSeek primary (`AI_PROVIDER_ORDER=deepseek,openai,anthropic,llm`)
- **Auth:** NextAuth.js with session-based authentication
- **Product analytics:** PostHog (`posthog-js` + `@posthog/react`, server via `posthog-node`)

### Observability — PostHog (May 17, 2026)

| Layer | Implementation |
|-------|----------------|
| **Client init** | `instrumentation-client.ts` + idempotent `initPostHog()` in `PostHogProvider` |
| **SPA pageviews** | `defaults: '2026-01-30'` in `lib/posthog-client-options.ts` (history API; no duplicate manual `$pageview` on route change) |
| **React context** | `@posthog/react` `PHProvider` in `components/providers/PostHogProvider.tsx` |
| **Server errors** | `lib/monitoring/posthog-server.ts` — `captureServerException` |
| **Env** | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`; server may use `POSTHOG_PROJECT_API_KEY` |
| **Tests** | `tests/unit/posthog-analytics.test.ts` (**4/4** May 17) |

Reference: [PostHog Next.js docs](https://posthog.com/docs/libraries/next-js). Optional production improvement: [managed reverse proxy](https://posthog.com/docs/advanced/proxy/managed-reverse-proxy) on `hoteletuna.com` (not self-hosted rewrites — Vercel egress).

### E2E — Playwright (May 17, 2026)

| Item | Detail |
|------|--------|
| Version | `@playwright/test` **1.60.0** |
| Projects | `chromium`, `mobile-chrome`, `tablet` |
| Responsive suite | `e2e/responsive-layout.spec.ts` — overflow + mobile nav |
| Run | `npm run test:e2e:responsive` (app on `http://127.0.0.1:3010` or set `PLAYWRIGHT_BASE_URL`) |

### DNS, domains & environment URLs (May 17, 2026)

**Registrar / DNS host:** Configure at your domain registrar (or Cloudflare) and attach domains in **Vercel → Project `hotel-etuna` (team `buffr`) → Settings → Domains**.

| Host | Role | Typical DNS (Vercel) |
|------|------|----------------------|
| **`www.hoteletuna.com`** | **Canonical production** (primary alias after deploy) | `CNAME` → `cname.vercel-dns.com` |
| **`hoteletuna.com`** (apex) | Redirect to `www` (recommended) or serve same app | `A` → `76.76.21.21` **or** `CNAME` → `cname.vercel-dns.com` (registrar-dependent) |
| **\*.vercel.app** | Preview deployments | Managed by Vercel (no manual DNS) |

**SSL:** Automatic via Vercel once DNS validates.

**Email (transactional, not web DNS):** `admin@hoteletuna.com`, `frontdesk@hoteletuna.com` — configure **MX / SPF / DKIM** at the mail host (e.g. Private Email per `.env.example` `SMTP_*`). Web app DNS does not send mail.

#### Local `.env.local` vs production (Vercel)

| Variable | Local development (`.env.local`) | Production (Vercel env) |
|----------|-------------------------------|-------------------------|
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://www.hoteletuna.com` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://www.hoteletuna.com` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://www.hoteletuna.com` |
| `ADUMO_REDIRECT_SUCCESS_URL` | `http://localhost:3000/payment/success` | `https://www.hoteletuna.com/payment/success` |
| `ADUMO_REDIRECT_FAIL_URL` | `http://localhost:3000/payment/failed` | `https://www.hoteletuna.com/payment/failed` |
| `ADUMO_WEBHOOK_URL` | `http://localhost:3000/api/webhooks/adumo` (or tunnel) | `https://www.hoteletuna.com/api/webhooks/adumo` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | Same (US Cloud ingest) |
| `DATABASE_URL` | Neon **dev** branch / local | Neon **production** branch (pooled) |

**Important:** Keeping `localhost` in `.env.local` is correct for local dev. Production URLs must **not** be copied from `.env.local` into Vercel manually for auth/payments — use:

```bash
npm run env:push-vercel          # applies PROD_OVERRIDES in scripts/push-env-to-vercel.mjs
npm run env:push-vercel:dry      # preview diff first
```

Override canonical origin without editing the script: `VERCEL_PRODUCTION_URL=https://www.hoteletuna.com npm run env:push-vercel`.

**Adumo / webhooks:** Register production redirect and webhook URLs in the Adumo merchant portal using the **same host** as `NEXTAUTH_URL` (prefer `www`).

**CORS / metadata:** App uses `NEXT_PUBLIC_APP_URL` for `metadataBase`, payment return URLs, and allowed origins — keep all three URL env vars aligned on production.

#### Webhooks, redirects & third-party callbacks

Use **`https://www.hoteletuna.com`** everywhere below in production (same host as `NEXTAUTH_URL`). Apex-only URLs work only if Vercel serves the app on apex without breaking SSL; prefer **www** and redirect apex → www.

| Type | Production URL | Env / portal | Local dev |
|------|----------------|--------------|-----------|
| **NextAuth / session** | Origin = `NEXTAUTH_URL` | Vercel: set by `env:push-vercel` | `http://localhost:3000` |
| **Adumo success redirect** | `/payment/success` | `ADUMO_REDIRECT_SUCCESS_URL` + **Adumo merchant portal** | `localhost:3000/payment/success` |
| **Adumo fail redirect** | `/payment/failed` | `ADUMO_REDIRECT_FAIL_URL` + Adumo portal | `localhost:3000/payment/failed` |
| **Adumo async webhook** | `POST /api/webhooks/adumo` | `ADUMO_WEBHOOK_URL` (JWT `notificationURL`) + Adumo portal; optional `ADUMO_WEBHOOK_HMAC_SECRET` | Tunnel (ngrok) or skip; localhost not reachable by Adumo |
| **WhatsApp (Meta)** | `GET/POST /api/webhooks/whatsapp` | Meta App → Webhooks → Callback URL; verify token = `WHATSAPP_VERIFY_TOKEN`; sign with `META_APP_SECRET` | Tunnel required for inbound messages |
| **Sofia voice provider** | `POST /api/sofia/voice/webhook` | Provider dashboard (when voice enabled) | Tunnel |
| **Dining deposit pay link** | `/restaurant/reservation/pay?code=…` | Email links use `NEXT_PUBLIC_APP_URL` | localhost |
| **App login redirects** | `/login?redirect=/guest` or `/dashboard` | Relative paths — no DNS; safe redirect rules in `proxy.ts` | Same |

**`npm run env:push-vercel`** overwrites on **production** target only: `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `ADUMO_REDIRECT_*`, `ADUMO_WEBHOOK_URL` (see `scripts/push-env-to-vercel.mjs` `PROD_OVERRIDES`). It does **not** auto-set Meta/WhatsApp callback URLs — configure those manually in Meta using the production host.

**Apex redirect:** If `https://hoteletuna.com` 301s to `www`, Adumo/Meta must still use the **final** HTTPS URL that receives `POST` webhooks (usually `www`). Do not register `localhost` or preview `*.vercel.app` URLs in Adumo production.

### Tenant Architecture (Hub-and-Spoke Model)

**Core Model:**
```
Hotel Etuna (hub)
  ├── Partner Network (Jayla, Aquarius, etc.)
  ├── Commission Tracking (10% default)
  └── Strict Data Isolation (RLS policies)
```

**Tenant Types:**
- **Hub:** Full platform access, Sofia AI exclusive, CRM for all guests, partner management
- **Partner:** Self-service dashboard, property management, booking tracking, NO AI/CRM access

**Isolation Strategy:**
- RLS policies enforce strict tenant boundaries
- Middleware blocks partners from hub-only endpoints (Sofia AI, CRM)
- Partner commission tracked via `bookings.commission_amount`

### AI Boundary Constraints

- **Sofia AI:** Hub-only, never accessible to partners
- **Rate Disclosure:** Sofia must not expose rates to unauthenticated users
- **Knowledge Base:** Hotel Etuna facts only (property-specific, not generic hospitality)
- **Guest Context:** Sofia can access folio for checked-in guests via session email

### Public vs. Gated UX

**Public (Unauthenticated):**
- Landing pages with content visibility
- Room/dining information (without pricing)
- Partner directory
- Sofia chat widget (rate-gated responses)

**Gated (Authenticated):**
- Full pricing visibility
- Booking flow
- Guest folio access
- Dashboard/admin features
- Partner portal

### Payment Strategy

**Cash Workflow (live):**
- Bookings support `cash` payment method
- `amount_tendered` and `change_given` tracked for reconciliation
- `receipt_number` generated for audit trail
- Reconciliation dashboard for daily/shift settlement
- **Reconciliation v1 (shipped):** `GET/POST /api/payments/reconciliation` — daily cash-up by date/shift; expected cash from booking deposits + desk cash; discrepancy notes + audit trail. **v2 backlog:** folio cash lines, NamQR confirm rows, bank-file import (migration `0061` if expanded).
- **Payroll domain:** `lib/services/payroll/PayrollService.ts`, `lib/platform/namibia-payroll.ts`, `app/api/payroll/*`, `/payroll` (founder/admin RBAC). Regulatory: `mba-agent/regulatory/namibia` + `TAX_AND_NAMRA_COMPLIANCE.md` §6.1.
- **Commission report:** `GET /api/reports/commission`, `/reports/commission` — partner totals by date range.
- **Open banking:** NamQR primary (`mba-agent/.../namibia_qr_code_standards.md` v5.0); PIS via `POST /api/bon/v1/banking/payments` + hub `POST /api/payments/open-banking/initiate` (`paymentRail`: `namqr` | `pis`). OAuth: `/api/bon/v1/common/par`, `/token`.

**NamQR desk (live):**
- Staff generate/confirm at `/payments/desk` (`NamQrDeskPanel`)
- `POST /api/payments/namqr/generate`, `POST /api/payments/namqr/confirm`
- Compliance payloads: `lib/compliance/namqr/nrtc-payload.ts`, `standards.ts`; tag 26 IPP via `encodeNamQrPayloadV5` in `lib/services/qr/namqr-core.ts`

**Manual off-platform payments (live):**
- `ManualPaymentService`, `POST /api/payments/manual` (EFT, e-wallet, bank deposit on desk form)
- NamQR bank-app confirm: `NamQrDeskPanel` only (avoids duplicate folio path vs manual form)
- Operator verify after Neon SQL: `npm run test:db:migrations` (`scripts/db/verify-neon-migrations.ts`, checks **0011–0017**)
- NamQR / manual folio settle triggers **payment receipt email** (`schedulePaymentReceiptEmail`, method `NamQR (bank app)`)
- **Guest financial PDFs (2026-06):** `generated_documents` (`0064`) + `DocumentGenerationService` — on-demand render via `@react-pdf/renderer`; metadata snapshot for re-download; auto-email via `documentLifecycleHooks` (quotation on payment-pending create, receipt/PN on completed txn, invoice on folio close); distinct from `guest_documents` travel vault. **Wiring gate:** `npm run validate:document-wiring` (also in `test:ci`).
- Pre-merge DB gate: `npm run test:db` (`scripts/db/verify-db.ts`)

**Card — Adumo Virtual (hosted page, preferred):**
- Guests pay on Adumo’s PCI page; we validate `_RESPONSE_TOKEN` JWT (signature + `mref` / `amount` / `cuid` / `auid`)
- `AdumoVirtualService` → `POST /api/payments/virtual/initiate` (alias `/api/payments/adumo/initiate`)
- Return URLs: `/payment/success`, `/payment/failed`; webhook: `POST /api/webhooks/adumo`
- `payment_sessions` maps `merchantReference` → `bookingId` (`0012_adumo_virtual_payment_sessions.sql`)
- UI: `components/payments/AdumoVirtualPaymentForm.tsx`, `AdumoPaymentReturn.tsx`
- Purposes: `booking_deposit`, `folio_settle`, `dining_deposit` → `completeAdumoVirtualPayment.ts`
- **Card rail:** Adumo Virtual only (`initialisevirtual`, JWT, `_RESPONSE_TOKEN` + webhook). No Stripe, RealPay, or Enterprise PAN API in repo.
- **Go-live:** live `ADUMO_*` credentials, Adumo portal payment page branding, one live test transaction
- **Validation:** `npm run validate:adumo`; integration `tests/integration/adumo-virtual-settlement.test.ts`

**Adumo Go Live Checklist (merchant portal + Vercel):**

| Step | Owner | Action |
|------|-------|--------|
| 1 | Dev | Keep **local** `.env.local` on **staging** URL + test MerchantUID/ApplicationUID/JWT for safe card tests |
| 2 | Dev | `npm run env:push-vercel:dry` — confirm production gets `ADUMO_BASE_URL=https://apiv3.adumoonline.com` and `https://www.hoteletuna.com` redirect/webhook URLs |
| 3 | Dev | After Adumo go-live email: set live `ADUMO_MERCHANT_UID`, `ADUMO_APPLICATION_UID`, `ADUMO_JWT_SECRET` in Vercel (never commit); `npm run env:push-vercel` |
| 4 | Ops | Adumo merchant portal: register success `/payment/success`, fail `/payment/failed`, webhook `POST /api/webhooks/adumo` on **www** host |
| 5 | Ops | Portal: hosted page branding/logo/CSS |
| 6 | Ops | One **live** test transaction on production after creds deployed; log merchant ref + transaction index (no PAN) in compliance evidence |
| 7 | Ops | Confirm settlement account routing (Etuna Nedbank vs Buffr) with Adumo |

**Adumo Test Configuration (staging only):**

| Key | Value |
|-----|-------|
| `ADUMO_BASE_URL` | `https://staging-apiv3.adumoonline.com` |
| `ADUMO_MERCHANT_UID` | `9BA5008C-08EE-4286-A349-54AF91A621B0` |
| `ADUMO_APPLICATION_UID` | `23ADADC0-DA2D-4DAC-A128-4845A5D71293` (3DS) |
| `ADUMO_JWT_SECRET` | `yglTxLCSMm7PEsfaMszAKf2LSRvM2qVW` |
| 3DS OTP | `test123` or `1234` (shown on ACS page) |

**Test Cards — 3D Secure (Application: `23ADADC0-DA2D-4DAC-A128-4845A5D71293`):**

| Card | Number | Result |
|------|--------|--------|
| Visa | `4000000000001091` | ✅ Success |
| Visa | `4000000000001109` | ❌ Fail |
| MasterCard | `5200000000001096` | ✅ Success |
| MasterCard | `5200000000001104` | ❌ Fail |
| Visa Frictionless | `4000000000001000` | ✅ Success (no ACS) |
| Visa Frictionless | `4000000000001018` | ❌ Fail (no ACS) |
| MC Frictionless | `5200000000001005` | ✅ Success (no ACS) |
| MC Frictionless | `5200000000001013` | ❌ Fail (no ACS) |

All test cards: Name = Joe Soap, any future expiry, any CVV.

**Non-3DS Test Cards (Application: `904A34AF-0CE9-42B1-9C98-B69E6329D154`):**

| Card | Number | Result |
|------|--------|--------|
| Visa | `4111111111111111` | ✅ Success |
| Visa | `4242424242424242` | ❌ Declined |
| MasterCard | `5100080000000000` | ✅ Success |
| MasterCard | `5404000000000001` | ❌ Declined |

**JWT Validation (MUST validate all 4 fields in `_RESPONSE_TOKEN` per Adumo docs):**
1. ✅ Signature verified against `ADUMO_JWT_SECRET`
2. ✅ `mref` matches session `merchantReference`
3. ✅ `amount` matches session amount (±0.005 tolerance for float)
4. ✅ `cuid` = `ADUMO_MERCHANT_UID`, `auid` = `ADUMO_APPLICATION_UID`

Use `result` field (`0` = success, `1` = success-with-warning, `-1` = failed). Parse `_STATUS` (`APPROVED` / `DECLINED` / `USER_CANCELLED`) for user-facing messages.

**Audit Requirements:**
- All cash state transitions logged to `audit_trail`
- Reconciliation table links bookings by date/shift
- RLS enabled on `cash_reconciliations`
- Adumo webhook/confirm payloads stored in `transactions.metadata` (no PAN)

**Platform commercial model (Buffr ↔ Hotel Etuna):**

| Entity | Bank | Account | Use |
|--------|------|---------|-----|
| Etuna Guesthouse and Tours CC | Nedbank | 11000481744 (461089, NEDSNANX) | **Guest** cash-equivalent collections (card settlement target, EFT, NamQR) |
| Buffr Financial Services CC | Bank Windhoek | 8050377860 (485-673, BWLINANX) | **Buffr** subscription & platform fee remittance only |

- **Adumo contract:** Buffr Financial Services (merchant UID in `ADUMO_*`). Buffr pays Adumo; property does not contract Adumo directly.
- **Card flow (today):** `AdumoVirtualService` → `payment_sessions` → `completeAdumoVirtualPayment` → `transactions` + booking/folio. Tag every row with property `tenant_id`; treat amount as **property revenue** in reports.
- **Card settlement (go-live):** Confirm with Adumo whether settlement lands on Buffr or can be directed to Hotel Etuna Nedbank; until then, run **pass-through ledger** (property payable) if settlements hit Buffr.
- **Buffr revenue:** Not mixed into guest checkout. Accrue **processing %** on successful card `transactions`; add **monthly subscription** from `tenants.monthly_price` / fee schedule; issue **platform invoice** to Hotel Etuna; payment EFT to Buffr account (manual mark-paid → P2 automation).
- **Services (live):** `PlatformBillingService`, `SettlementAccountService`, `PlatformFeeService`; `completeAdumoVirtualPayment` persists `platform_fee_accruals` on each Adumo success.
- **UI:** `/payments/platform-billing` — settlement accounts, accrual summary, generate/issue/mark-paid invoices.
- **Config:** Property settlement profile in `system_settings` (`category: settlement`) or future `settlement_accounts` table; never expose Buffr billing account on guest payment pages.
- **Commercial terms:** Buffr ↔ Etuna platform-fee, dual-VAT (§4.5), and SLA terms are tracked with counsel out-of-band (no in-repo proposal doc). Technical canon for fees/VAT: this section + `lib/platform/namibia-tax.ts`, `PropertyVatService`, UI `/reports/property-vat`.

### Offline/PWA Strategy

**Resilience Model:**
- Offline read mode for cached content
- IndexedDB queue for offline bookings
- Replay on reconnect via background sync
- Offline banner with connection status

**Implementation:**
- `manifest.json` for PWA installability
- `sw.js` service worker with caching strategy
- Offline fallback page at `/offline`
- `ServiceWorkerRegistration` component

### Session Security Model

**Timeout Policy:**
- 30m inactivity timeout
- 2m warning prompt before expiration
- 8h absolute session maximum
- Middleware enforces expired token redirect

**Implementation:**
- `SessionTimeoutWrapper` tracks activity
- Client-side timer with server-side validation
- Session refresh on user interaction

### Software design principles

**Reference:** `SYSTEM_DESIGN_MASTER_GUIDE.md` Part 1. Apply on every PR touching APIs, schema, or UI.

| Principle | Hotel Etuna application |
|-----------|-------------------------|
| **KISS** | Monolith Next.js on Vercel + Neon; no premature microservices or message queues |
| **DRY** | `proxy.ts` + `withApiAuth` + `requireTenantSessionUser`; Sofia/SOC2/fraud single paths above; `lib/copy/`; Drizzle schema as DDL source |
| **Boy Scout** | When editing a route, add missing validation, logging, or tests in the same PR |
| **Prefer duplication over wrong abstraction** | Hub CRM vs partner portal stay separate; do not force one "PropertyDashboard" for both |
| **Ship stable** | Idempotent forward-only SQL migrations; never `DROP` audit/compliance tables |

**Decision framework (when to abstract):**

- Abstract when the **same business rule** appears 3+ times (e.g. tax/commission calculation, tenant scoping).
- Keep duplicate when concepts **diverge by role** (hub Sofia vs partner contact form).

### Scale & capacity posture

**Reference:** Master guide Parts 4–5, 7 (scale estimation).

| Dimension | Current target | Bottleneck if exceeded | Mitigation |
|-----------|----------------|------------------------|------------|
| Concurrent guests | &lt;500 DAU | Neon connection limits | Pooled `DATABASE_URL`; avoid long transactions |
| Public page TPS | Low | SSR/DB on cache miss | ISR 300s; index `tenant_id`, `property_id` |
| API writes | Bookings, cash, folio | Row lock contention | Short transactions; `db.transaction` for folio settle |
| Sofia QPS | Low | Embedding/LLM cost & latency | Rate limit chat; cache top FAQs later (backlog) |
| Storage | GB-scale/year | None at hub scale | Archival policy for audit logs (future) |

**Scaling ladder (in order):** Vercel auto-scale (stateless) → Neon compute upgrade → read replica for reporting → Redis for session/hot reads → CDN for static assets. Load balancer and consistent hashing are **Vercel-managed** — not custom-built.

**CAP / PACELC:** See PRD §6.6.2. Bookings/payments/folio = **consistency**; public ISR content = **availability + latency**.

### Caching strategy

**Reference:** Master guide Part 5 (caching).

| Layer | Mechanism | Hotel Etuna use |
|-------|-----------|-----------------|
| CDN / browser | Vercel edge | Static assets, ISR HTML |
| App | Next.js `revalidate` | Landing, public sections (300s) |
| Cache-aside | On ISR miss | Drizzle query → render → cache |
| Write-through | N/A at app layer | DB is source of truth on every write |
| Vector store | Qdrant | RAG chunks; rebuild on ingest only |

**Invalidation:** Review `is_public` toggle → `revalidatePath('/')` or wait ISR TTL. Room rate changes visible within ISR window unless path revalidated.

**Do not cache:** Authenticated booking APIs, payment initiate, folio mutations, admin CRM.

### API design standards

**Reference:** Master guide Part 3. Product rules in PRD §4.3.2.

**Composition stack (target for new routes):**

1. `proxy.ts` — public whitelist / session / hub-only 403
2. `withApiAuth` — session + `tenant_id` + role
3. Zod (or equivalent) — body/query validation
4. Drizzle — parameterized queries only
5. Standard JSON error envelope — no stack traces in production

**REST checklist for new endpoints:**

- [ ] Plural resource path under `/api/`
- [ ] Correct HTTP method (GET non-mutating)
- [ ] `401` / `403` / `404` / `429` used consistently
- [ ] Tenant scope enforced (middleware + RLS)
- [ ] Rate limit on abuse-prone paths
- [ ] Response shape documented in route comment (Rule 7)

**Protocols not used:** GraphQL, gRPC, WebSockets (except possible future Sofia stream). AMQP/queues deferred until async workload justifies it.

### Security architecture

**Reference:** Master guide Part 6 + Part 10. **Hotel Etuna prompts:** [`docs/SECURITY_PROMPT_PACK.md`](../SECURITY_PROMPT_PACK.md) (15 sections + Master Review + Deployment Pre-Flight). Execution checklists in **`TASK.md`**. Automated §15 checks: `npm run security:preflight` → `compliance/evidence/security/`.

| Area | Model | Implementation |
|------|-------|----------------|
| **Authentication** | Session + JWT claims (`tenant_id`, `role`) | NextAuth (primary); Stack Auth optional; platform admin resolves via `getAuthenticatedEmail()` |
| **Authorization** | RBAC + RLS | Roles: owner, manager, admin, staff, **super-admin** (Buffr); hub-only routes in `proxy.ts`; `isPlatformAdmin()` for `/admin/platform` |
| **API security** | Rate limit, CORS, parameterized SQL, CSRF via SameSite cookies | Per PRD §6.2; verify in TASK |
| **PII** | Guest email, phone, folio | GDPR/POPIA backlog; audit trail for sensitive ops |
| **Transport** | HTTPS only on Vercel | HSTS via platform; secure cookies |

**Buffr Connect audit lessons (applied here):**

| Audit finding | Hotel Etuna guardrail |
|---------------|----------------------|
| 67% route duplication | Extend `withApiAuth` / shared handlers; avoid copy-paste error handling |
| Manual SQL strings | Drizzle only; no string-concatenated SQL |
| Missing rate limits | Partner invite 5/hr; public APIs 100/min/IP (PRD) |
| DROP on audit tables | Forward-only migrations; never drop `audit_trail` |
| Wrong component layers | UI in `/components` only; modular DaisyUI components |

### AI / multi-provider resilience

**Reference:** Master guide Part 8–9 (cost-first, multi-provider).

- **Cost-first routing:** Cheapest viable model per task (embeddings vs chat).
- **Failover:** DeepSeek → Anthropic → Groq for Sofia replies.
- **No production mocks:** Graceful degradation (Sofia unavailable message), not fake RAG results.
- **Security pack after AI features:** Run TASK.md § AI Security Prompt Pack when adding tools, ingest, or new guest-facing AI surfaces.

### Namibia regulatory & compliance engineering (May 2026)

**PRD:** §3.7 · **Index:** `docs/compliance/NAMIBIA_REGULATORY_FRAMEWORK.md` · **BoN sources:** `mba-agent/documents/mba-agent/regulatory/namibia/` (Appendix F in PRD).

| Workstream | Implementation | Doc / gap |
|------------|----------------|-----------|
| **Merchant posture** | Adumo hosted card; NamQR desk + confirm; Etuna Nedbank settlement | PSP Guidance — avoid Buffr facilitator without PSD-1 |
| **PSD-12** | `PsdPaymentFraudGate`, 2FA, `cybersecurity_incidents`, IRP | G-04 live BoN API |
| **FICA / AML** | `aml_*` (alerts, STR, velocity — not PEP), STR APIs, KYC UI | G-05 FIC filing; PEP screening out of scope |
| **Fraud DB** | `0016` seed + `tenant-fraud-rules.ts` → `PsdFraudGate` / analyze API | Production fail-closed; P2: NPS trend rules in seed |
| **NamQR** | `lib/compliance/namqr/*`, tag 17 NRTC, tag 26 IPP | `namibia_qr_code_standards.md` |
| **SOC 2** | `Soc2AuditOrchestrator`, `/compliance/soc2`, `soc2-evidence.yml` | G-08 policies 21/21 drafted; CEO sign-off + G-09 vendor packs |
| **Security pack** | `npm run security:preflight` | §15 partly manual |
| **Privacy** | Legal pages + program docs | G-01 DSAR; G-06 cookies |

**Settlement rule:** Guest card revenue → property beneficiary; platform fee → Buffr invoice — never net-settle guest proceeds for Buffr fees without audit trail (PRD §3.4, Buffr SLA).

---

## Implementation Approach

### Phase Plan (Execution Order)

#### Phase 1 — Public Site Hardening ✅
- DB-driven content for home, rooms, dining, partners
- Shared `PublicHero` + `PublicFooter` components
- Gated content and redirect-aware sign-in/up paths
- **Auth entry split:** header → guest (`/login?redirect=/guest`); footer → staff (`/login?redirect=/dashboard`) — PRD §3.3.1
- **Session-aware chrome:** `PublicAuthNav` + `lib/auth/public-session-nav.ts`; dev `DevTestSessionBanner` for leftover `@example.com` cookies
- **Buffr platform admin:** NextAuth-backed `getCurrentPlatformAdmin()`; `provision-platform-admin.ts`; `@buffr.ai` + `super-admin` — PRD §3.3.2
- **Guest hub:** `/guest` lists active stays, payment due, past stays, loyalty; traveller register → hub tenant + `guest` role; `linkGuestAccountForHubUser` on register/verify; `lib/auth/roles.ts` routing — PRD §3.3.3
- **Guest security:** Consumer-only `/api/guest/*`; verified email + `is_signed_up` for stay access; no open redirect on middleware login — PRD §3.3.3
- **Production:** Password policy, optional Turnstile, Redis rate limits (`RATE_LIMIT_REDIS_REQUIRED`), canonical types in `lib/db/schema-types.ts` — PRD §3.3.4
- **System map (structure + RBAC + journeys):** PRD **§3.6** — canonical for roles, route/API matrices, J1–J7 flows; **§2.4** maps marketing personas to roles; file tree PRD **§4.6** (regenerated May 2026)

### Frontend intent & RBAC map (validated June 2026)

**Drizzle + Neon (checked):**

| Layer | Finding |
|-------|---------|
| `lib/db/schema.ts` | `users.role` is **`varchar(50)`** — no Postgres enum for app roles; only `tenant_type` enum (`hub` \| `partner`). |
| `database/drizzle/meta/_journal.json` | **48** SQL files tagged `0000`–`0054` (operator path). |
| Neon `drizzle.__drizzle_migrations` | **3** rows only (legacy `drizzle-kit` `0000`–`0002`); `0003`–`0054` applied via operator SQL / Neon MCP — not `drizzle-kit migrate`. |
| `npm run test:db:migrations` | **46/46** checks on live Neon. |

**Hotel Etuna hub operators (your model — not generic PRD `desk`/`kitchen`):**

Team inboxes in `lib/copy/brand.ts` + `lib/copy/contact-emails.ts` — map to **`owner`** or **`staff`** at login provision time:

| Inbox | Email | Function | Target `users.role` | On Neon today |
|-------|-------|----------|---------------------|---------------|
| Founder | `founder@hoteletuna.com` | Executive | `owner` | ❌ not provisioned |
| Administration | `admin@hoteletuna.com` | Legal, partners | `owner` | ✅ `owner` |
| Front desk | `frontdesk@hoteletuna.com` | Reservations, desk, check-in | `staff` | ❌ not provisioned |
| Marketing | `marketing@hoteletuna.com` | Events, introducers, campaigns | `staff` | ❌ not provisioned |
| Support | `support@hoteletuna.com` | Portal / website help | `staff` | ❌ not provisioned |

Also on Neon: `manager@hoteletuna.com` (`owner`); **19 CI `@example.com` `admin` rows** (test noise, not hotel staff).

**Guests, partners, introducers (three different things):**

| Actor | Where it lives | Login? | Surface |
|-------|----------------|--------|---------|
| Guests / users | `users` hub, `role: guest` \| `user` | Self-register | `/guest/*` — **0 on Neon** |
| Lodging partners | `tenants.type=partner`, `role: partner_admin` | Invite | `/partner/*` — JayLa + Aquarius ✅ |
| Introducers | `introducers` table (referral codes) | **No** — hub staff manage CRM | `/crm/introducers`, public `/introducers-directory` — **0 rows** |

**Canonical roles → surfaces** (single-property hub + partner spokes):

| Actor | `users.role` | Sign-in entry | Home after login | Primary routes | Must not see |
|-------|--------------|---------------|------------------|----------------|--------------|
| Anonymous | — | — | `/`, `/rooms`, `/dining` | Marketing, gated rates | Prices/booking until login |
| Guest / traveller | `guest`, `user` | Header → `/login?redirect=/guest` | `/guest` | `/guest/*`, own stays/folio | Staff dashboard, other guests’ data |
| Hub team (inboxes above) | `owner`, `staff` | Footer → `/login?redirect=/dashboard` | `/dashboard` | Ops sidebar (**per-inbox trim not shipped**) | `/admin/platform`, `/compliance/*`, `/fraud/*` |
| Partner lodge operator | `partner_admin` | Partner invite/login | `/partner/dashboard` | `/partner/*` (7 nav items) | Hub Sofia, CRM, `/api/guest/stays/*` |
| Buffr platform ops | `admin`, `super-admin` (`@buffr.ai`) | Direct | `/admin/platform` | Platform console | N/A (elevated) |

**Three UX planes:**

1. **Public** — `app/layout.tsx` only; `proxy.ts` `PUBLIC_ROUTES` (+ `/introducers-directory` public per PRD).
2. **Guest command centre** — `app/guest/layout.tsx`; page access via `proxy.ts`; **folio/API** gated by `GUEST_API_ROLES` + email match (`guestStayAccess.ts`).
3. **Authenticated ops** — Hub: `(dashboard)/layout.tsx` + `Sidebar.tsx`; Partner: `partner/layout.tsx` + `PartnerSidebar.tsx`; Platform: `admin/platform/layout.tsx` + `PlatformSidebar.tsx`.

**Permission layers (defence in depth):**

| Layer | File | Notes |
|-------|------|-------|
| Edge page RBAC | `proxy.ts` | `hasRouteAccess()`, hub-only API 403 for partners |
| Post-login routing | `lib/auth/roles.ts` | `getPostLoginRedirect()` — partner → `/partner/dashboard` |
| Public nav CTA | `lib/auth/public-session-nav.ts` | Signed-in label/href by role |
| API guards | `lib/utils/api-helpers.ts` | `requireTenantSessionUser`, `requireRole` |
| Stay scope | `lib/services/folio/guestStayAccess.ts` | Verified email + booking email match |
| RLS | `lib/auth/tenant-context.ts` | `app.tenant_id` per request |
| Platform probe | `app/api/auth/check-platform-admin/route.ts` | Layout client guard |

**Shipped vs PRD vision (gaps to improve):**

| Surface | Shipped | Gap / improvement |
|---------|---------|-------------------|
| Guest `/guest` | Stays, folio, room service, loyalty, profile, DSAR, room QR | Phase 8: magic-link pre-arrival, document vault, messaging, agentic nudges; nav lacks dedicated “Stays” tab |
| Partner `/partner` | 7-item portal + property CRUD | Dual path: partners also reach trimmed hub `Sidebar` on `/dashboard` — decide single canonical UX |
| Staff dashboard | Full sidebar for all hub roles | Sidebar not trimmed per **team inbox** (frontdesk vs marketing vs support vs founder/admin) |
| Introducer CRM | Staff `/crm/introducers/*` | Public `/introducers-directory` now public (proxy fix) |
| Payments | Desk, reconciliation, 2FA on initiate | Desk UX still manual UUID paste |
| Housekeeping | Kanban board + APIs | `housekeeping_supervisor` can view board; task **create** still manager+ on API |
| Platform console | Tenants, users, support | Home has mock revenue; analytics page placeholder |

**Evidence paths:** `proxy.ts`, `lib/auth/roles.ts`, `components/shared/Sidebar.tsx`, `PartnerSidebar.tsx`, `app/guest/layout.tsx`, PRD §2.4 + §3.6.
- `lib/data/rooms.ts` as DRY source for room queries
- Rustic brand token usage
- **Digital menu (`/dining`):** Neon-only `getCompleteMenu()` → `serializePublicMenu()` + `MenuPopularityService` → `PublicMenuBoard` / `MenuBookFullMenu` / `MenuBookSinglePageViewer` (one full-width page at a time, Previous/Next; food **2×3** grid with name/description/price on tiles; drink lists). View-only banner. CMS `/menu/[itemId]/edit`; scripts `seed:menu-images`, `validate:menu-images`, `seed:menu-images:full` — PRD §3.1.1
- **Room photo tours (`/rooms`, `/rooms/[slug]`):** Same `RoomPhotoTour` for guests and signed-in users; rates masked on public cards (`RoomBookingCard`, filmstrip); sign-in required for `#booking` widget; `takeTheTour` CTA everywhere; `/rooms#tour` scroll target; `public-rate.ts` + availability API rate strip — PRD §3.1.2

#### Phase 2 — Cash Ops ✅
- Migration `0007` for cash columns + reconciliation table
- Booking cash mark-paid endpoint + receipt support
- Reconciliation API + dashboard page
- Audit trail writes for all cash state transitions

#### Phase 3 — PWA/Offline ✅
- `manifest.json`, `sw.js`, offline fallback page
- Offline banner and service worker registration
- IndexedDB queue for offline bookings, replay on reconnect

#### Phase 4 — Session Security ✅
- 30m inactivity timeout
- 2m warning prompt
- 8h absolute session max
- Expired token redirect in middleware

#### Phase 5 — Sofia RAG (Qdrant Inference) ✅
**Status:** `npm run rag:seed` upserts 27 chunks (4 markdown files) via Qdrant Cloud Inference.

**Stack:** Chat = **DeepSeek** (`AI_PROVIDER_ORDER=deepseek,...`). Embeddings = **Qdrant only** (`RAG_USE_QDRANT_INFERENCE=true`, `QDRANT_INFERENCE_MODEL=intfloat/multilingual-e5-small`, `QDRANT_INFERENCE_DIMENSIONS=384`). No external embedding API.

**Operator:**
```bash
npm run test:db:migrations   # 18/18
npm run rag:seed:dry
npm run rag:seed             # optional --upsert-batch=4
```

**Troubleshooting:**
- Enable **Inference** on the Qdrant Cloud cluster (Console → Inference).
- Dimension mismatch: collection must be **384d** — delete `buffr_rag` or set a new `RAG_QDRANT_COLLECTION` if it was created at 1024d.
- Sofia smoke: "What does Etuna mean?" / breakfast hours (needs `RAG_ENABLED=true`).

#### Sofia memory vs Ava (`ava-whatsapp-agent-course`)

| Concern | Ava course agent | Hotel Etuna Sofia |
|--------|------------------|-------------------|
| **Conversation transcript** | SQLite `memory.db` (short-term) | Neon `ai_conversations` + `ai_messages` |
| **Long-term semantic memory** | Qdrant collection `long_term_memory` (local `all-MiniLM-L6-v2` embeddings) | **Neon** `crm_guest_memory_facts` (primary) + `crm_graph_edges`; optional **Mem0** if `MEM0_API_KEY` — **not** in Qdrant |
| **Property knowledge (RAG)** | N/A in course | Qdrant `buffr_rag` (384d, tenant-scoped), Cloud Inference at query time |
| **Post-turn enrichment** | `MemoryManager` → vector store | `CrmMemoryBridge` → `SofiaGuestFactExtractor` → Neon facts + graph edges; Mem0 optional |
| **Restaurant reservation deposit** | N/A | Adumo `dining_deposit` — `/restaurant/reservation/pay`, `dining_reservations`, folio line if `stay_booking_id` |

Qdrant in Hotel Etuna is **knowledge-base retrieval only**, not a copy of Ava’s per-user long-term memory collection. Full chat history lives in PostgreSQL for audit, CRM, and session continuity.

#### Phase 6 — Tests ✅
**Status:** Complete per `TASK.md` (Vitest + smoke + PostHog unit); Playwright expanded May 17; workflow tests **78/78** pass

**Delivered:**
1. Playwright: gated pricing, public components, auth journeys, **responsive-layout**; **3 viewport projects** (desktop / mobile / tablet)
2. PostHog: instrumentation + `@posthog/react` + shared client options (`defaults: '2026-01-30'`)
3. Integration coverage for review approval endpoints
4. Sofia/email suite FK fixes
5. Gates: `npm run test:db` + `test:db:migrations` + `vitest run` + `test:smoke` ✅; `tests/workflows/*` **78/78**; optional `npm run test:e2e:*`

#### Phase 7 — Cleanup/Docs ✅
**Status:** Complete per `TASK.md`

**Delivered:**
1. Obsolete ad-hoc scripts removed; use `scripts/db/*`, Vitest, Playwright
2. Planning docs consolidated (`docs/project/`)
3. PRD, PLANNING.md, and TASK.md aligned (May 16, 2026)
4. `SYSTEM_DESIGN_MASTER_GUIDE.md` reflected in PRD §6.6 / §4.3.2 / §11.5–11.6, PLANNING architecture sections, TASK security checklists

### Agentic CRM & Intelligent OS roadmap (Phases 8–12) — June 8, 2026

Forward‑looking architecture for the product vision in **PRD §1.1** (core promise: *“An OS that anticipates, adapts, and elevates every stay.”*). These phases **extend** the shipped foundation — they reuse existing rails, do not introduce new providers, and must clear the same Verification Standard below. Subtask checklist: `TASK.md` § Agentic CRM & Intelligent OS (Vision). KPIs: PRD §8.1.

**Architectural guardrails (binding — do not break):**

| Concern | Constraint |
|---------|------------|
| Database | Neon PostgreSQL + Drizzle ORM only; no raw SQL injection; forward‑idempotent migrations; RLS per `tenant_id`. |
| Auth | NextAuth credentials primary; Stack Auth optional; platform admin via `@buffr.ai` (see § Session Security Model). |
| Payments | Adumo Virtual (card) + NamQR + cash; **no Stripe, no RealPay** for guests. |
| Multi‑tenancy | Hub (Etuna) + partners; RLS enforced; **Sofia/AI hub‑exclusive** — partners get none. |
| Performance | ISR for public pages; API p95 <300ms; Vercel edge caching (see § Caching strategy). |
| Security | CSRF on mutations; rate limits on auth/payment/invite; immutable audit (hash chain). |
| Testing | Vitest unit + integration; Playwright E2E; `security:preflight` CI gate. |

**Phase architecture notes:**

| Phase | Focus | New surfaces / where it lands |
|-------|-------|-------------------------------|
| **8** | Guest command centre | `app/guest/*` expansion; digital check‑in; service/maintenance requests → staff tasks; folio widget reuses `FolioService`. New tables via next migration numbers (claim in `docs/MIGRATION_MASTER.md`). |
| **9** | Staff intelligence layer | `app/(dashboard)/*` real‑time alerts (poll/SSE); voice commands (Sofia tool calls); predictive housekeeping/maintenance routing in `lib/services/*`; PWA push (existing service worker, § Offline/PWA Strategy). |
| **10** | Sofia co‑pilot | Extend Sofia pipeline (§ OSS pattern porting W7 LangGraph tool graph); layered memory in Neon (`crm_guest_memory_facts` + `crm_graph_edges`, optional Mem0 mirror); sentiment + handover; multi‑channel context unification; language auto‑detect. Hub‑exclusive boundary unchanged. |
| **11** | Intelligent OS | Forecasting services (`lib/services/*`) producing **rate recommendations only** — suggestions are written to a review queue and an admin/front‑desk approval is required before any `rooms.base_rate` change; nothing is auto‑applied. Forecasting methodology follows Hyndman & Athanasopoulos *Forecasting: Principles and Practice* (FPP3) — explore series first, then ETS/ARIMA on occupancy/ADR/RevPAR with lead‑time/event signals. inventory **reorder recommendations** on `InventoryService` (suggested → admin/front‑desk approves; never auto‑ordered); predictive maintenance from complaint history; POPIA anonymisation jobs (`lib/cron/`). No OTA/channel‑manager sync (no Booking.com/Expedia integration). |
| **12** | UX polish | Design‑system audit against § Frontend design system; skeletons everywhere; offline queue (IndexedDB); WCAG 2.1 AA; keyboard shortcuts for staff dashboard. |

**Out of scope (unchanged):** two‑way OTA sync; RealPay/Stripe; Sofia/AI for partners; net‑settling Buffr invoices from guest card proceeds without consent + audit.

### Verification Standard (Per Phase)

Every phase must pass:
1. `npx tsc --noEmit`
2. `npm run build`
3. Targeted manual journey walkthrough
4. RLS verification script
5. Phase commit with clear message

### Implemented Deliverables (Cash & Offline Track)

| Area | Primary Files |
|------|---------------|
| Cash payment API | `app/api/bookings/[id]/payment/route.ts` |
| Reconciliation API | `app/api/payments/reconciliation/route.ts` |
| Cash UI | `CashPaymentModal.tsx`, `BookingReceipt.tsx` |
| Reconciliation UI | `app/(dashboard)/payments/reconciliation/page.tsx` |
| NamQR v5 compliance | `lib/compliance/namqr/nrtc-payload.ts` (tag 17 NRTC desk), `standards.ts`; tag 26 IPP via `encodeNamQrPayloadV5` in `lib/services/qr/namqr-core.ts` |
| NamQR desk API/UI | `app/api/payments/namqr/generate`, `confirm`, `app/(dashboard)/payments/desk/page.tsx`, `NamQrDeskPanel`, sidebar **Payments desk** |
| Manual off-platform payments | `ManualPaymentService.ts`, `settleOffPlatformFolio.ts`, `app/api/payments/manual/route.ts`, `ManualPaymentForm` (EFT/e-wallet/deposit only) |
| Neon migration verify | `scripts/db/verify-neon-migrations.ts` — `npm run test:db:migrations` (18 checks incl. `0016` fraud seed, `0017` Sofia session index) |
| DB baseline verify | `scripts/db/verify-db.ts` — `npm run test:db` |
| Compliance smoke | `tests/smoke/compliance-fraud-db.smoke.test.ts` — `npm run test:smoke` or `npm run test:all` |
| RLS post-0004 tables | `database/drizzle/0015_rls_inventory_payment_sessions.sql` |
| F&B inventory | `database/drizzle/0011_fnb_inventory.sql`, `lib/services/inventory/InventoryService.ts`, `app/api/inventory/*` |
| Schema/migration | `lib/db/schema.ts`, `0007_cash_payments_and_reconciliation.sql` |
| PWA/offline | `manifest.json`, `sw.js`, `app/offline/page.tsx` |
| Session security | `SessionTimeoutWrapper` + middleware session expiry |

---

## Database Design

**Reference:** Master guide Part 2 (relational modeling, SQL vs NoSQL).

**Modeling rules for this codebase:**

- Hub **tenant** is the isolation boundary; `tenant_id` FK on all tenant-owned rows.
- **One-to-many:** `properties` → `rooms` → `bookings`; partner commission on `bookings.commission_amount`.
- **Many-to-many / ledger:** `booking_charges` links folio lines to bookings without denormalized arrays.
- **Never** store searchable lists in a single column (e.g. comma-separated room IDs).
- **Split tables** when attributes diverge: `guest_profiles` (marketing) vs `booking_charges` (in-stay ledger).
- **PostgreSQL only** for transactional data; Qdrant is a derived search index, not source of truth for rates.

**Query discipline:**

- Parameterized Drizzle templates only (`sql` tagged templates with `${}` binding).
- Index FK columns (`tenant_id`, `property_id`, `booking_id`) on hot paths.
- Use `db.transaction()` for folio order + charge + payment (see Guest Folio Architecture below).

### Migration History and Strategy

**Tracked Migrations (Local):**
- `0000` - Initial schema baseline
- `0001` - Core tables (tenants, properties, rooms, users)
- `0002` - Authentication and audit trail
- `0003` - Partner network (tenant types, commission tracking)
- `0007` - Cash payments and reconciliation
- `0009` - Booking charges and folio system
- `0010` - Booking charges RLS policies
- `0011` - F&B inventory (SKUs, movements, low-stock alerts)
- `0012` - Adumo Virtual `payment_sessions`
- `0013`–`0014` - Platform billing + invoice VAT
- `0015` - RLS for `booking_charges`, inventory, `payment_sessions`, `stock_movements`
- `0016` - Fraud detection rules seed (`0016_fraud_detection_rules_seed.sql`)

**Neon Schema Status:**
- Migration journal shows entries `0000-0002` only
- However, live schema contains objects from later migrations (applied via MCP)
- This drift was intentional to avoid destructive `drizzle-kit push` operations

### Schema Evolution (Migration 0003: Partner Network)

**Tenant Model Enhancement:**

| Table | Change | Purpose |
|-------|--------|---------|
| `tenants` | Added `type` enum ('hub', 'partner') | Distinguish hub from partners |
| `tenants` | Added `parent_tenant_id` | Link partners to hub for commission |
| `tenants` | Added `commission_percent` (default 10%) | Configurable commission rate |
| `bookings` | Added `commission_amount` | Track hub commission on partner bookings |
| **NEW** `partner_invites` | Created table | Manage invite tokens for partner onboarding |

**Indexes Created:**
- `idx_tenants_type` - Fast filtering by tenant type
- `idx_tenants_parent_tenant_id` - Partner → hub lookups
- `idx_bookings_commission_amount` - Commission reporting
- `idx_partner_invites_email` - Invite email lookups
- `idx_partner_invites_token` - Token validation
- `idx_partner_invites_claimed` - Filter claimed/unclaimed invites
- `idx_partner_invites_expires_at` - Expire old tokens

**Constraints:**
- Commission percent: 0-100 range validation
- Commission amount: Non-negative validation
- Hub tenants: Cannot have `parent_tenant_id`
- Partner tenants: Must have `parent_tenant_id`
- Partner invites: Unique tokens (UUID v4)

### Cash Operations Schema (Migration 0007)

**Bookings Table Enhancements:**
- `payment_method` - cash | card | bank_transfer
- `payment_status` - pending | paid | failed
- `amount_tendered` - Cash given by customer
- `change_given` - Change returned
- `receipt_number` - Generated receipt identifier

**New Table: `cash_reconciliations`**
- Links bookings by reconciliation date/shift
- Tracks expected vs. actual cash totals
- Foreign key to `bookings` table
- RLS enabled with tenant isolation policy

### Guest Folio Architecture (Migrations 0009-0010)

**Problem:** Guests who are checked in should order room service and pay later (mid-stay or checkout). Room rate may already be paid; incidentals must not be conflated with guest profiles.

**Chosen Model (Option A):**
```
booking (stay)
  ├── booking_rooms → room(s)
  ├── booking_charges[]     ← folio ledger (room | fnb | tax | payment)
  ├── restaurant_orders[]   ← kitchen workflow (links via reference_id / booking_id)
  ├── inventory_items[]     ← F&B SKU stock (migration `0011`, `InventoryService`)
  └── guest_profiles        ← loyalty (updated on folio settlement)
```

**Alternatives Considered:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| `booking_charges` only | Clear accounting; extensible | Extra table + APIs | **Use** |
| `restaurant_orders.payment_status` only | Fewer tables | No room/minibar lines; mixes ops + accounting | Reject |

### Hospitality bookkeeping (Namibia — MBA / Libby)

**Domain:** `lib/domain/accounting/` — COA, journal types, MBA synonym map (`accounting-terminology.ts`).

**Service:** `HospitalityAccountingService` — period pack from settled folio lines + guest payments + platform fee accruals.

**API:** `GET /api/reports/accounting/summary?from=&to=` (owner/manager/admin).

| MBA source | Platform use |
|------------|----------------|
| Libby — accounting cycle, A = L + E | Double-entry journal from `booking_charges` / `transactions` |
| Synonymous terms (P&L, revenue, recognize) | `reportLabels` on period export |
| RWJJ Ch.3 — pro-forma, EFN | Future: forecast from occupancy % (not P1) |
| RWJJ Ch.6 — OCF, ΔNWC, CAPEX | `operatingCashFlow` summary; CAPEX/depreciation P2 |
| NamRA VAT | Separate output/input VAT lines; property VAT report `/api/reports/property-vat` |

**Entity:** Etuna Guesthouse And Tours CC · CC/2011/3890 · VAT 05517026-015.
| Hybrid | Orders for kitchen, charges for money | Two writes per order | **Use** — current implementation |

**Implementation Map:**

| Layer | Path |
|-------|------|
| Migration | `database/drizzle/0009_booking_charges_folio.sql` |
| Schema | `lib/db/schema.ts` — `bookingCharges`, `bookingChargeTypeEnum`, `folioClosedAt` |
| Service | `lib/services/folio/FolioService.ts` |
| Access | `lib/services/folio/guestStayAccess.ts` |
| Types | `lib/types/folio.ts` |
| Validation | `lib/utils/validation.ts` — `guestRoomServiceOrderSchema`, `guestFolioSettleSchema` |
| APIs | `app/api/guest/stays/[bookingId]/folio|orders|settle/route.ts` |
| Public QR | `app/api/public/room-qr/[code]/route.ts` |
| Room charge hook | `app/api/bookings/[id]/payment/route.ts` → `ensureRoomChargeForBooking` |
| Tests | `tests/integration/folio-guest-stay.test.ts` |

**Recommended Next Implementations:**
1. ~~RLS on `booking_charges`~~ — done (`0010` + `0015`)
2. ~~Guest UI~~ — `app/guest/stays/[bookingId]/page.tsx` live
3. ~~Room QR~~ — `GET /api/public/room-qr/[code]`
4. Adumo on public `BookingForm` checkout deposit (folio + `BookingDepositPayCard` done — PSD-12)
5. Booking create hook for automatic room charges (verify coverage vs `ensureRoomChargeForBooking`)
6. Partial settle support
7. Sofia tool for `get_guest_folio`

**Check-in Gate (Security):**
All folio mutations MUST call `assertCheckedIn(booking)` except read-only staff access.

**Transaction Boundaries:**
Use `db.transaction` for: order + items + fnb charge; settle + payment line + mark charges + transactions + loyalty update.

### RLS Posture and Policies

**RLS Enabled Tables:**
- `bookings`
- `guests`
- `properties`
- `partner_invites`
- `tenants`
- `cash_reconciliations` (enabled via reconciliation)

**Key Policies:**
- `tenant_access_bookings` - Tenant can only see own bookings
- `tenant_access_guests` - Tenant can only see own guests
- `tenant_access_properties` - Tenant can only see own properties
- `tenant_access_tenants` - Tenant can only see self
- `tenant_access_cash_reconciliations` - Tenant can only see own reconciliations
- `hub_only_partner_invites` - Only hub can manage invites

**Policy Pattern:**
```sql
CREATE POLICY "policy_name" ON table_name
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Database Reconciliation Strategy

**Risk Assessment:**
- **High risk:** Running `drizzle-kit push` on production at current drift state
- **Medium risk:** Policy regression due to mixed migration history
- **Low risk:** Cash schema presence (already verified)

**Safe Reconciliation Plan:**

**Phase A — Freeze Risky Path:**
1. Disallow `drizzle-kit push` on prod/main until drift reconciliation complete
2. Use reviewed, explicit SQL migrations only

**Phase B — Baseline Capture:**
3. Export current schema snapshot from Neon (`pg_dump --schema-only`)
4. Capture policy inventory (`pg_policies`) and RLS flags (`pg_class.relrowsecurity`)

**Phase C — Controlled Reconciliation Migration:**
5. Create forward-only migration (e.g., `0008_reconcile_neon_baseline.sql`) that is idempotent:
   - Add missing constraints/indexes with `IF NOT EXISTS`
   - Avoid broad policy reset loops
   - Never disable RLS globally
6. Apply table-by-table and verify each policy immediately

**Phase D — Verification Gates:**
7. Re-run SQL checklist and assert no regressions
8. Run app gates: `npm run verify:production`
9. Record outcome in `docs/project/TASK.md`

**SQL Verification Checklist (Read-Only):**

```sql
-- Migration journal
SELECT id, hash, created_at
FROM drizzle.__drizzle_migrations
ORDER BY id;

-- Cash columns present
SELECT table_schema, table_name, column_name
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name='bookings'
  AND column_name IN ('payment_method','payment_status','amount_tendered','change_given','receipt_number')
ORDER BY column_name;

-- Cash table exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema='public'
    AND table_name='cash_reconciliations'
) AS cash_reconciliations_exists;

-- RLS enabled flags
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public'
  AND c.relname IN ('tenants','partner_invites','bookings','guests','properties','cash_reconciliations')
ORDER BY c.relname;

-- Policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('tenants','partner_invites','bookings','guests','properties','cash_reconciliations')
ORDER BY tablename, policyname;

-- Constraints
SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       con.conname,
       con.contype,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public'
  AND c.relname IN ('tenants','bookings','partner_invites','cash_reconciliations')
ORDER BY c.relname, con.conname;

-- Indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname='public'
  AND tablename IN ('bookings','cash_reconciliations','tenants','partner_invites')
ORDER BY tablename, indexname;
```

**Execution Log:**
- Date applied: April 29, 2026
- Executed via Neon MCP `run_sql_transaction`
- Verified: RLS enabled on `cash_reconciliations`, tenant access policy created
- Note: Drizzle journal still shows 0000-0002 only (intentional)

### Data Seeding Strategy

**Hub Seed Script:** `scripts/seed-hotel-etuna.ts`

**Seeded Data:**
- 1 hub tenant (Hotel Etuna)
- 1 property (Hotel Etuna, Ongwediva)
- Standard Room (Types A/B/C), Executive Room, Premiere Room
- 1 restaurant (Etuna Restaurant)
- 12 menu categories (from `etuna-restaurant-menu-catalog.ts`)
- 136+ menu items in catalog; **live public menu** from `cms_menu_items` (~110+ available rows typical)
- Menu dish thumbnails: `scripts/seed-menu-images.ts`, `scripts/validate-menu-images.ts`, `lib/data/menu-item-image-urls.ts` (480×360)
- inventory SKUs linked when migration `0011` applied
- 1 hotel admin user (manager@hoteletuna.com / `owner` / Test1234!)
- Buffr platform admin: `scripts/provision-platform-admin.ts` (e.g. george@buffr.ai — not part of hub seed)

**Features:**
- Idempotent (checks for existing data)
- Supports `--dry` flag for preview
- Supports `--force` flag for updates
- Uses `ON CONFLICT` for upserts
- Proper bcrypt password hashing
- Generates valid UUIDs

**Knowledge Base Ingestion:** `scripts/ingest-hotel-etuna-knowledge.ts`

**Ingests 4 documents** (all `.md` in `data/hotel-etuna-knowledge/`):
1. `hotel-etuna-facts.md` — Property info, contact, amenities
2. `room-descriptions.md` — Five room types (descriptions; rates gated on site)
3. `restaurant-menu.md` — Full menu with prices (for staff/Sofia context)
4. `local-area.md` — Location, transport, local tips

> **Removed:** `tours-guide.md` (May 2026). Re-run ingest after deploy so Qdrant drops stale tour chunks.

**Requirements:**
- `QDRANT_URL`, `QDRANT_API_KEY`, `HUB_TENANT_ID`, `RAG_USE_QDRANT_INFERENCE=true` in `.env.local`
- `QDRANT_INFERENCE_MODEL=intfloat/multilingual-e5-small`, `QDRANT_INFERENCE_DIMENSIONS=384`
- Inference enabled on Qdrant Cloud cluster
- `DEEPSEEK_API_KEY` — Sofia **chat** only
- `AI_PROVIDER_ORDER=deepseek,openai,anthropic,llm` for Sofia replies

---

## Deployment Strategy

### Pre-Deployment Checklist

**Build Verification:**
- [ ] `npm run verify:production` passes (tsc → Vitest → next build)
- [ ] Or manually: `npm run build` + `npx vitest run`
- [ ] Playwright E2E on CI: `npm run test:e2e:desktop` (optional job; needs webServer or staging `PLAYWRIGHT_BASE_URL`)
- [x] Refresh `tests/workflows/ci-workflow.test.ts` + `deploy-workflow.test.ts` to match current GitHub Actions YAML (May 17, 2026)

**Database Verification:**
- [ ] Cash columns + `cash_reconciliations` verified via SQL checklist
- [ ] Never apply `drizzle-kit push` if plan contains mass `DROP POLICY`
- [ ] RLS policies intact (run verification script)

**Secrets Verification:**
- [ ] Qdrant keys + `RAG_USE_QDRANT_INFERENCE` in Vercel are current
- [ ] If credentials were exposed, rotate in-provider and update Vercel only
- [ ] Never commit secrets to repository

### Vercel Environment Configuration

Configure per environment (Production / Preview):

| Key | Notes |
|-----|--------|
| `DATABASE_URL` | Neon pooled URI |
| `DATABASE_URL_UNPOOLED` | Neon direct URI for migrations/long sessions |
| `NEXTAUTH_URL` | Production canonical URL |
| `NEXTAUTH_SECRET` | Strong secret (never reuse) |
| `HUB_TENANT_ID` | Hub UUID |
| `DEFAULT_PROPERTY_ID` | Property UUID |
| `QDRANT_URL` | Qdrant Cloud |
| `QDRANT_API_KEY` | Scoped API key |
| `DEEPSEEK_API_KEY` | Sofia chat (primary) |
| `RAG_USE_QDRANT_INFERENCE` | `true` |
| `QDRANT_INFERENCE_MODEL` | `intfloat/multilingual-e5-small` |
| `QDRANT_INFERENCE_DIMENSIONS` | `384` |
| `RAG_ENABLED` | `true` for Sofia KB retrieval |
| `SMTP_*` | SMTP for transactional email |
| `ANTHROPIC_API_KEY` | Optional LLM fallback only |

**Security Notes:**
- Do NOT paste keys into tickets or chat
- Rotate secrets immediately if exposed
- Use Vercel environment variable dashboard only

### Post-Deployment Verification

**Smoke Tests:**
- [ ] Run automated smoke gates in **`TASK.md`** § Production smoke
- [ ] Manual smoke via **`TASK.md`** § Production smoke within 24h of deploy
- [ ] Vercel logs + Neon dashboard - no spike in 5xx errors

**Database Checks:**
- [ ] Verify cash columns present
- [ ] Verify RLS policies intact
- [ ] Verify reconciliation table accessible

**Application Checks:**
- [ ] Public pages render correctly
- [ ] Authentication flow works
- [ ] Booking flow completes
- [ ] Sofia AI responds appropriately
- [ ] Offline mode functions

### OSS pattern porting (June 2026)

Study `buffr-host/source-codes/*`; port **patterns** into Etuna — **no runtime OSS imports**.

| Priority | OSS reference | Etuna domain | Notes |
|----------|---------------|--------------|-------|
| W1 ✅ | `QRMeal`, `OpenKDS` | `lib/services/fnb/`, `/restaurant/kitchen` | `0045_fnb_print_jobs.sql`; print dispatch via `fnb-print-dispatch-service.ts` (see Dispatch agents below) |
| W2 ✅ | `Aegispay` | `lib/services/payment/` | FSM + outbox; cron `payment-outbox-dispatch` |
| W3 ✅ | `trailkit` | `lib/compliance/` | Hash chain on `audit_trail`; `AUDIT_HASH_CHAIN_ENABLED` |
| W4 ✅ | `dubbl` | `lib/services/accounting/` | Period close + journal lines on `/reports/accounting` |
| W5 ✅ | Night audit patterns | Night audit + folio void + reservation SM | `0050_night_audit_runs.sql` |
| W6 ✅ | Availability ledger | Availability ledger + facility switcher (single property) | `0051_availability_ledger.sql` |
| W7 ✅ | LangGraph tooling | Sofia tool graph + pipeline telemetry | `0052_sofia_pipeline_runs.sql` |
| W8 ✅ | Cal.com + durable cron | Cal webhooks + `scheduler-dispatch` cron | `0049` + `0053` + `0054` |

**Canonical (Etuna-native, do not replace):** NamQR desk, folio→GL, guest hub, BoN incident reporting.

**Tracker:** `docs/project/TASK.md` § OSS porting waves. Per-repo study index is below (§ Dispatch agents & OSS porting).

#### Dispatch agents & OSS porting

Hotel Etuna's "dispatch agents" are the **background/event surfaces** that move work
without a human in the loop — cron sweeps, webhooks, the durable scheduler, the
notification fan-out, and Sofia's tool-calling graph. Waves W1–W8 (table above) are
**complete**; the patterns were studied in `buffr-host/source-codes/*` and reimplemented
natively (Drizzle + Stack Auth + daisyUI).

**Rule:** never `import` from `buffr-host/source-codes/*` at runtime — study only. Check
license before copying substantial logic (MIT/Apache preferred; AGPL = patterns only).

**Dispatch surface (where the agents live):**

| Surface | Path | Trigger | Notes |
|---------|------|---------|-------|
| Durable scheduler | `lib/services/scheduling/DurableScheduler.ts` + `schedulerJobHandlers.ts` | `GET /api/cron/scheduler-dispatch` (Bearer `CRON_SECRET`) | `dispatchPending()` drains `scheduler_jobs`; handlers: night-audit, payment-outbox-dispatch, intelligence-digest (`0047`) |
| Cal.com webhooks | `lib/services/scheduling/CalWebhookService.ts` | `POST /api/webhooks/cal` | HMAC verify + idempotent upsert into `cal_booking_mirrors` (`0051`) |
| Notification fan-out | `lib/services/notifications/NotificationDispatchService.ts` | `schedulerJobHandlers` (`notification-dispatch`), check-in reminders cron, partner weekly digest | respects `users.notification_preferences`; logs `notification_history` (`0049`) |
| Payment outbox | `lib/services/payment/paymentOutbox.ts` | `GET /api/cron/payment-outbox-dispatch` | transactional outbox drain of `payment_outbox_events` (`0045`) |
| Other cron sweeps | `app/api/cron/{booking-reminders,intelligence-digest,email-inbox-monitor,uptime-monitor}/route.ts` | Vercel Cron (`vercel.json`) | Bearer `CRON_SECRET` |
| Sofia tool graph | `lib/workflows/sofiaToolGraph.ts`, `lib/ai/agent-registry.ts` | `SofiaPipelineService.process()` (`SOFIA_TOOL_GRAPH_ENABLED`) | tools: `searchRag`, `getGuestProfile`, `checkAvailability`; telemetry → `sofia_pipeline_runs` (`0050`) |

**Per-repo study index** (what to read in `buffr-host/source-codes/<repo>/`, where it was ported):

| Repo | Study paths | Ported into |
|------|-------------|-------------|
| `Aegispay` | `src/domain/paymentStateMachine.ts`, `src/infra/transactionalOutbox.ts`, `idempotency.ts` | `lib/services/payment/` (FSM + outbox) |
| `cal.com`, `inngest-js` | webhook HMAC verify; durable step/queue patterns | `CalWebhookService`, `DurableScheduler`, `schedulerJobHandlers` |
| `novu` | preference-aware notification dispatch | `NotificationDispatchService` |
| `JackTheButler` | `src/core/pipeline/index.ts`, `src/services/memory.ts` | `SofiaConciergeService` / `SofiaPipelineService` split |
| `langgraphjs` | `examples/streaming/.../simple-tool-graph.ts` | `lib/workflows/sofiaToolGraph.ts` |
| `QRMeal`, `OpenKDS` | order line snapshots; station completion | `OrderService`, `fnb-print-dispatch-service.ts`, kitchen board |
| `trailkit` | `packages/core/src/audit.ts`, `event.ts` | `AuditHashService`, `record-audit.ts` (hash chain on `audit_trail`) |
| `dubbl` | `lib/api/period-close.ts`, entry void route | `HospitalityAccountingService`, accounting UI |
| `pura-pms`, `haip` | reservation state machine, night audit, folio void | `ReservationStateMachine`, `NightAuditService`, folio void UI |
| `innkeeper`, `pesan-pms` | availability ledger, RLS, property switcher | `AvailabilityLedgerService`, `PropertySwitcher` |

### Deferred Items (Tracked, Not Blocking)

**Vector Ingestion:**
- Re-run `npm run rag:seed` after KB markdown changes (27 chunks / 4 files as of May 2026)
- Ingestion is a maintenance-window task (Phase 5)

**Partner features (live — remaining gaps only):**
- ✅ Partner portal `/partner/dashboard`, public listings `/partners/[slug]`, invite claim flow
- Hub **commission reporting** dashboard (aggregates by partner/date) — PRD §2.2; field exists on bookings, dedicated hub report UI/API still thin
- Guest self-scan NamQR on folio (desk flow live; guest folio scan deferred per `TASK.md`)

**Card — Adumo (PSD-12):**
- ✅ `AdumoVirtualService`, webhooks, folio settle UI, `BookingDepositPayCard` on guest stay/folio
- 🚧 Public `BookingForm` deposit checkout; live `ADUMO_*` credentials + portal branding; Neon `0012` migration if not applied

---

## System map — SQL ↔ API ↔ Frontend

Single source of truth for "where does this domain live end-to-end." Granularity is
**per domain** (not all 111 tables). Schema: `lib/db/schema.ts`; migrations:
`database/drizzle/*.sql` (47 files, latest `0051`); API: `app/api/**/route.ts`
(175 routes, ~40 domains); dashboard: `app/(dashboard)/**` (64 pages). Public/auth/guest
pages live under `app/(public|auth|guest)` and `lib/data/*`.

| Domain | Key tables | Migration(s) | API route group | Frontend page(s)/components |
|--------|-----------|--------------|-----------------|----------------------------|
| Tenancy & properties | `tenants`, `properties`, `property_settings`, `partner_invites` | `0003`–`0006`, `0039`–`0044` | `/api/properties`, `/api/partners`, `/api/platform` | `/properties`, `/properties/[slug]`, `/properties/new`, `/admin/platform/properties`, `PropertySwitcher` |
| Auth, users, sessions | `users`, `user_sessions`, `two_factor_auth` | `0000`–`0002`, `0038` | `/api/auth`, `/api/user`, `/api/settings` | `(auth)/login\|register\|reset`, `/profile`, `/settings`, `/admin/platform/users` |
| Staff | `staff`, `staff_shifts` | baseline | `/api/staff` | `/staff`, `/staff/new` |
| Rooms & inventory | `rooms`, `room_rates`, `room_availability_ledger`, `room_qr_codes` | `0039`–`0041`, `0049` | `/api/rooms`, `/api/properties/availability-ledger` | `/properties/availability`, `AvailabilityLedgerPanel`; public `/rooms` via `lib/data/rooms.ts` |
| Bookings & folio | `bookings`, `booking_rooms`, `booking_charges`, `night_audit_runs` | `0009`,`0010`,`0042`,`0048` | `/api/bookings`, `/api/folio` | `/bookings`, `/bookings/new`, `/bookings/[id]`, `/bookings/night-audit`, `FolioVoidTransactionDialog` |
| F&B / restaurant | `restaurants`, `restaurant_tables`, `restaurant_orders`, `restaurant_order_items`, `menu_categories`, `fnb_print_jobs` | `0011`,`0018`,`0019`,`0045_fnb_print_jobs` | `/api/restaurant`, `/api/fnb`, `/api/menu`, `/api/dining` | `/restaurant/{orders,menu,tables,kitchen}`, `/menu`, `/menu/new`, `kitchen-ticket-board` |
| CRM / guests | `guests`, `guest_profiles`, `guest_reviews` | baseline, `0017` | `/api/crm`, `/api/guests`, `/api/guest` | `/crm`, `/crm/guests/[id]`, `/crm/reviews`, `/crm/knowledge` |
| Loyalty | `loyalty_tiers`, `loyalty_tier_benefits`, `loyalty_transactions`, `loyalty_rewards`, `loyalty_redemptions` | `0033`–`0037` | `/api/crm/loyalty` | `/crm/loyalty/catalog`, `/crm/loyalty/transactions`, guest `/guest/loyalty` |
| Introducers | `introducers` | `0031`,`0031b` | `/api/introducers`, `/api/partners` | `/crm/introducers`, `/crm/introducers/[id]`, `/crm/introducers/[id]/bookings`, public `/partners` |
| Housekeeping | `housekeeping_tasks` | `0021` | `/api/housekeeping` | `/housekeeping` |
| Payments (card/cash/NamQR) | `payment_sessions`, `payment_methods`, `cash_reconciliations`, `namqr_codes`, `namqr_pending_confirmations`, `settlement_accounts`, `payment_outbox_events`, `payment_security_audit` | `0007`,`0012`,`0015`,`0020`,`0046_payment_outbox` | `/api/payments`, `/api/bon`, `/api/qr`, `/api/webhooks` (adumo) | `/payments/{desk,reconciliation}`, guest deposit `BookingDepositPayCard` |
| Platform billing & fees | `platform_invoices`, `platform_invoice_lines`, `platform_fee_accruals`, `platform_fee_schedules` | `0013`,`0014` | `/api/platform`, `/api/payments` (billing) | `/payments/platform-billing`, `/admin/platform/analytics` |
| Accounting & tax | `accounting_period_locks`, `transactions`, `monthly_balance_tracking`, `daily_transaction_tracking`, `trust_accounts` | `0048_accounting_period_locks` | `/api/reports`, `/api/tax` | `/reports/accounting`, `/reports/property-vat`, `/payments/property-vat`, `HospitalityAccountingPanel` |
| Sofia AI | `ai_conversations`, `ai_messages`, `sofia_*` (email inbox/threads/logs/incoming, voice, pipeline_runs) | `0017`,`0050` | `/api/ai`, `/api/sofia`, `/api/public/sofia`, `/api/cron/email-inbox-monitor` | `/sofia`, `/sofia/email`, public chat widget |
| CMS | `cms_pages`, `cms_blocks`, `cms_content`, `cms_media`, `cms_menu_items` | `0029`,`0029b` | `/api/cms` | `/cms`, `/cms/pages`, `/cms/pages/[id]`, `/cms/pages/new` |
| Fraud | `fraud_alerts`, `fraud_cases`, `fraud_detection_rules`, `fraud_device_fingerprints`, `fraud_risk_profiles`, `fraud_statistics` | `0016` | `/api/fraud` | `/fraud` |
| Compliance / AML / KYC | `aml_*`, `kyc_*`, `consumer_rights_requests`, `electronic_signatures`, `bon_incident_reports`, `cybersecurity_incidents` | compliance migs | `/api/compliance` | `/compliance/kyc`, `/compliance/kyc/[caseId]`, `/compliance/kyc/new` |
| Audit / SOC 2 / system | `audit_trail`, `system_logs`, `system_settings`, `record_retention_audit` | `0047_audit_trail_hash_chain` | `/api/compliance` (audit), `/api/admin` | `/compliance/soc2`, `/admin/platform/{audit,soc2}` |
| Scheduling & notifications (dispatch) | `scheduler_jobs`, `notification_history`, `cal_booking_mirrors` | `0047`,`0051` | `/api/cron/scheduler-dispatch`, `/api/webhooks/cal`, `/api/cron/*` | background — surfaced via intelligence digest (see § Dispatch agents) |
| Open Banking (P2) | `ob_api_transactions`, `ob_consent_tokens`, `ob_participants` | ob migs | `/api/payments` (ob) | none yet (schema only) |
| Analytics & dashboard | reads across domains | — | `/api/analytics`, `/api/dashboard` | `/dashboard`, `/analytics`, `/admin/platform/analytics` |
| Channels (WhatsApp/voice) | `tenant_whatsapp_settings`, `sofia_voice_sessions` | baseline, `0050` | `/api/webhooks/whatsapp`, `/api/sofia` | Sofia channels (no dedicated page) |

**Conventions:** every protected route uses `withApiAuth` / `requireTenantSessionUser`
(`lib/utils/api-helpers.ts`); tenant isolation via Neon RLS (see § RLS Posture);
route allowlist in `proxy.ts`. Migration numbering: Drizzle `_journal.json` ends at
`0002`; `0003`+ are idempotent forward SQL applied via `scripts/db/apply-all-missing-migrations.ts`.

### Frontend design system (production-verified 2026-06-07; airy pass 2026-06-18)

Guest brand is **Hotel Etuna only**; the platform console is `@buffr.ai` operator-only.
All buttons inherit `rounded-full` from `.btn` in `globals.css` (no per-button class
needed). Tokens live in `tailwind.config.ts`; brand copy in `lib/copy/{brand,public}.ts`.
State primitives: `LoadingSpinner`, `ErrorDisplay`, `EmptyState` (used across pages).
PWA: `public/sw.js` (cache v3 + IndexedDB offline queue), `public/manifest.json`,
`/offline`. Accessibility: WCAG 2.1 AA, ≥44px touch targets, semantic HTML, focus rings
(`ring-khaki-600`). Open frontend gaps are tracked in `TASK.md` § Production gaps.

**Airy / photography-first tokens (Etuna vocabulary — never third-party naming):**
| Token / class | Role |
|---------------|------|
| `surface.background` / `nude-50` | Page canvas |
| `surface.elevated` / white | Cards, headers |
| `shadow-etuna-elevated` | Search, modals, sticky booking only |
| `rounded-etuna-card` | Listing/browse tiles (20px) |
| `.etuna-listing-card` | No shadow browse shell |
| `.etuna-filter-pill` | Category chips (8px radius; CTAs stay `rounded-full`) |
| `components/features/marketing/*` | `EtunaListingCard`, `EtunaCarouselRow`, etc. |

Dashboard/partner/platform shells use flat `.dashboard-card` / `Card variant="flat"` (border `nude-200`, no lift). Legacy `shadow-nude-*` retained only on `.etuna-hero-band` VIP bands until redesigned.

---

## Migration Plans

### Completed Migrations

**Migration 0003: Partner Network (April 28, 2026)**
- Added tenant type enum and commission tracking
- Created `partner_invites` table
- Added indexes for tenant type, parent relationships, commissions
- Added constraints for commission validation

**Migration 0007: Cash Operations (April 29, 2026)**
- Added cash payment fields to `bookings`
- Created `cash_reconciliations` table
- Added indexes for payment method and reconciliation lookups
- Enabled RLS on `cash_reconciliations`

**Migration 0009: Guest Folio System**
- Created `booking_charges` table for in-stay billing
- Added `booking_charge_type_enum` (room | fnb | tax | payment)
- Added `folio_closed_at` timestamp to bookings
- Links to `restaurant_orders` via reference_id

**Migration 0010: Booking Charges RLS**
- Enabled RLS on `booking_charges`
- Added tenant isolation policy
- Guest access enforced via application layer (not DB policies)

### Pending Migrations

**Operator runbook (SQL files 0003–0015):** Drizzle `_journal.json` ends at `0002`; numbered files under `database/drizzle/` are **idempotent forward SQL** applied manually on Neon. See `TASK.md` § Neon operator migrations.

**Migration 0008: Schema Reconciliation**
- Repeats 0007 cash DDL + RLS on `cash_reconciliations` (safe to run once on Neon)
- Verification: SQL checklist before/after

**Migration 0015: RLS for post-0004 tables**
- `inventory_items`, `payment_sessions`, and inventory child tables (movements, alerts, menu links)

**Future: Payment provider hardening**
- Wire `AdumoVirtualPaymentForm` on public/admin `BookingForm` checkout deposit (folio already wired)
- Adumo portal: branded hosted page, live credentials, production smoke with test/live card
- Confirm settlement account routing (Hotel Etuna Nedbank vs Buffr pass-through)
- Refund/dispute flow via Adumo console (no Enterprise API in app)

**Future: Partner & reconciliation ops**
- Hub commission reporting UI/API (partner bookings already store `commission_amount`)
- Extend cash reconciliation beyond booking-level check-in date (folio / NamQR / manual)
- Guest self-scan NamQR on folio

---

## Local Development & Knowledge Ingestion

**Setup Steps:**
1. Install deps: `npm install`
2. Copy `.env.example` → `.env.local` and set:
   - Hub/property UUIDs
   - Neon URLs (pooled + unpooled)
   - LLM keys (Anthropic, Groq)
   - Qdrant URL + API key + `RAG_USE_QDRANT_INFERENCE=true` (384d)
   - SMTP credentials
   - NextAuth URL + secret
3. Apply schema: `npm run db:push` (or migration workflow)
4. Seed data (dry run first):
   ```bash
   npx tsx scripts/seed-hotel-etuna.ts --dry
   npx tsx scripts/seed-partners.ts --dry
   ```
5. Ingest RAG corpus (dry run optional):
   ```bash
   npx tsx scripts/ingest-hotel-etuna-knowledge.ts --dry
   ```
   Run without `--dry` when Qdrant Inference is enabled on the cluster
6. Dev server: `npm run dev` → http://localhost:3000

**Ingestion Troubleshooting:**
- Enable Inference on Qdrant Cloud cluster
- Dimension mismatch: collection must be **384d** — delete `buffr_rag` or use new `RAG_QDRANT_COLLECTION` if created at 1024d
- Verify `QDRANT_INFERENCE_DIMENSIONS=384` matches collection

**Sofia Smoke Test:**
With `RAG_ENABLED=true`, ask doc-specific questions:
- "What does Etuna mean?" → Should cite Oshiwambo meaning
- "What time is breakfast?" → Should return **07:00–10:00** (lunch/dinner/bar **10:00–22:00**)
- "What room types are available?" → Standard A/B/C, Executive, Premiere

---

## Brand Copy Strategy (`lib/copy/`)

**PRD:** §7.6 · brand/design-system locked decisions: `docs/project/PRD.md` § Brand & design system  
**Token canon:** `tailwind.config.ts` (all hex lives here)

**Canonical Modules:**
- `lib/copy/brand.ts` - Brand identity, values, voice
- `lib/copy/auth.ts` - Auth flow copy
- `lib/copy/public.ts` - Public-facing content
- `lib/copy/guest.ts` - Guest experience copy
- `lib/copy/index.ts` - Re-exports

**Guidelines:**
- Guest-facing UI must NOT use Buffr SaaS phrases:
  - "Free Forever"
  - "No credit card required"
  - "Hospitality management platform" (as hero positioning)
- Sofia + `KnowledgeBaseService` describe Hotel Etuna the **property** (Ongwediva, room tiers, N$ rates)
- Remaining wiring: room/dining page bodies, CMS blocks, email templates → import from `lib/copy`

---

## Verified Implementation Audit (May 16, 2026)

Code inspection and commands run against the repo (not agent reports alone). Details in **`TASK.md`** § Verified Implementation Audit.

| Area | Claim (agents) | Verified in repo |
|------|----------------|------------------|
| **API §4.7 gaps** | Bookings GET, menu PATCH/DELETE, staff CRUD, shifts | ✅ Route files exist; bookings GET returns top-level JSON array for calendars |
| **CORS** | No wildcard `*` | ✅ `allowedOrigin` in payments + KYC routes |
| **Debug endpoint** | 404 in production | ✅ `app/api/debug/auth/route.ts` checks `NODE_ENV` |
| **Error sanitization** | No stack in prod | ✅ `sanitizeErrorDetails` in `lib/utils/api-helpers.ts` |
| **RLS** | Tenant isolation | ✅ `verify-tenant-rls.ts` exit 0 |
| **Public UI** | `lib/copy`, khaki CTAs | ✅ `publicCopy.gated`; no `text-gray-*` under `app/` |
| **Scripts** | Production only | ✅ `scripts/` + `scripts/db/`; archive deleted May 2026 |
| **TypeScript** | Zero errors | ✅ `npx tsc --noEmit` exit 0 |
| **API route count** | 92–117 | ✅ **136** `app/api/**/route.ts` (`find … \| wc -l`, May 16, 2026) |
| **RAG ingest** | Ready | 🟡 Config documented; Qdrant upsert still manual |
| **npm audit** | 0 critical | ✅ **0 critical** at `--audit-level=critical` (`package.json` overrides); moderate/high may remain |
| **Service duplicates** | None | ✅ Single `MenuService`, single `FraudDetectionService` paths |

**Doc hygiene:** One-off May 16 audit markdown files under `docs/` were merged here, into PRD §12, and TASK — then removed per doc canon.

---

## SOC 2 Readiness (Security, Availability, Confidentiality)

**Benchmark:** NayaOne Limited SOC 2 Type II (Feb 2023–Feb 2024); AICPA TSC 2017.  
**Scope:** Hotel Etuna PMS on Vercel + Neon + Adumo Virtual; hub operator **Buffr Financial Services CC**. Dev environments out of scope unless they hold production data.

| Phase | Weeks | Actions |
|-------|-------|---------|
| **1 — Preparation** | 1–2 | TSC familiarization; scope boundary; gap analysis vs `PLANNING.md`, `TASK.md`, RLS/PSD-12 controls |
| **2 — Implementation** | 3–8 | Cross-functional owners; system description; formal policies (access, change, incident, vendor) |
| **3 — Evidence** | 9–12 | Vercel/Neon logs, access reviews, incident records, vendor SOC reports + CUECs; optional Vanta/Drata trial |
| **4 — CPA audit** | 13+ | Type I (design) or Type II (6–12 mo operating effectiveness) |

**In-repo automation (not CPA attestation):**

| Asset | Path |
|-------|------|
| Six evidence agents | `lib/compliance/soc2/agents/*` |
| Orchestrator | `lib/compliance/soc2/Soc2AuditOrchestrator.ts` |
| API | `GET /api/compliance/soc2?action=status\|export\|full-report`; alias `GET /api/compliance/soc2/audit?from=&to=` |
| Dashboard | `/compliance/soc2` |
| CLI export | `npx tsx scripts/soc2/collect-evidence.ts` → `compliance/evidence/soc2/` |

**Hotel Etuna control mapping (existing):** tenant RLS → CC6.6; RBAC + payment 2FA → CC6.1–6.2; `audit_trail` → CC7.1; cash reconciliation + folio → processing integrity; Adumo → PSD-12 / C1.3; CRM consent → privacy (manual policy pack).

**Gaps to close before Type II:** 21-policy employee handbook, org-wide MFA on IdP, logged quarterly access reviews, Vercel/Neon subservice CUEC matrix, DR restore drill evidence, POPIA DPIA/DSAR runbook.

---

## Hotel Etuna — DRY & Boy Scout Roadmap (May 17, 2026)

**Scope:** `hotel-etuna/` only — production PMS (~136 API routes, `app/api`, `lib/services`, `database/drizzle`, `docs/compliance`).

| Area | Single source of truth | Status |
|------|------------------------|--------|
| Sofia concierge | `processSofiaConciergeMessage()` → `lib/services/ai/sofia-concierge-handler.ts` | ✅ |
| Sofia HTTP | `lib/services/ai/sofia-api-handlers.ts` | ✅ |
| SOC2 runtime | `Soc2AuditOrchestrator` + `control-matrix.ts` + `run-all-soc2-agents.ts` | ✅ |
| SOC2 static catalog | `nayaone-tsc-framework.ts`; `control-catalog.ts` re-exports only | ✅ May 17 |
| Fraud (tenant rules) | `lib/services/fraud/tenant-fraud-rules.ts` on `PsdPaymentFraudGate` | ✅ |
| Tenant API auth | `requireTenantSessionUser()` in `lib/utils/api-helpers.ts` | ✅ |
| DB schema | `lib/db/schema.ts` + forward SQL in `database/drizzle/` | ✅ |

**Boy Scout backlog (in-repo):**

- [x] Apply `0017_ai_conversations_tenant_session_idx.sql` on Neon → `npm run test:db:migrations` **18/18** (May 17, 2026)
- [ ] G-08 executive policy sign-off → `compliance/evidence/policies/`
- [ ] G-01 / G-06 DSAR + cookie consent
- [ ] Full `npm run test:ci` before major release

**Do not DRY:** hub CRM vs partner portal; folio ledger vs marketing profile; compliance policy markdown vs runtime control seeds (different audiences).

---

## References & Archived Narratives

**System design canon:**

| Topic | Location |
|-------|----------|
| Full course (3556 lines) | `SYSTEM_DESIGN_MASTER_GUIDE.md` (repo root) |
| Product NFRs (scale, CAP, caching) | `PRD.md` §6.6 |
| REST API rules | `PRD.md` §4.3.2 |
| Security verification | `TASK.md` § Security verification, § Pre-launch security |
| Claude skills (optional) | `hotel-etuna/.claude/skills/system-design-*` |

**Historical Context:**
- Early "offline/cash" reports captured schema/API gaps *before* migration `0007` and UI work
- Current implementation documented in `TASK.md` and this file
- Do not use obsolete root copies — they were merged and deleted

**Executive Engineering Snapshot:**
- Component-level status for Sofia, CRM, RAG, compliance, fraud stacks
- Lives in **`TASK.md`** § Production status
- Keep updated when phases close

**Testing Procedures:**
- **`TASK.md`** § Production smoke (landing page + reviews)
- **`TASK.md`** § Testing Procedures — `npm run test:all`, `test:db`, `test:db:migrations`, compliance smoke
- **`TASK.md`** § Production status (SQL verification notes)

**Planning Hierarchy:**
- **PRD:** `docs/project/PRD.md` - Product requirements and features
- **Planning:** `docs/project/PLANNING.md` (this file) - Architecture and strategy
- **Tasks:** `docs/project/TASK.md` - Implementation checklist

---

## E2E journey resolution (2026-06-19)

**Runner:** `scripts/e2e-journey-runner.ts` (Playwright fallback; `agent-browser` daemon unavailable).

| Issue | Resolution |
|-------|------------|
| J5/J6 compile latency | `--only j5,j6` + `warmStaffPartnerRoutes()` pre-login compile |
| Pre-hydration login GET leak | `LoginForm` `method="post"` |
| Staff password mismatch | `ADMIN_PASSWORD` from `.env.local` in runner + `e2e/helpers/login.ts` |
| J7 platform admin | `npm run provision:platform-admin` → `scripts/provision-platform-admin.ts` |
| J3 Adumo | Skip in automation; manual Adumo staging |
| Folio refresh on booking | `BookingFolioSection` already wires `onConfirmed={() => load()}` |

**Database core (hub-and-spoke):** `tenants` → `users` / `properties` / `rooms` → `bookings` → `booking_charges` (folio) + `payment_sessions` (Adumo/NamQR). Schema: `lib/db/schema.ts`; migrations: `database/drizzle/*.sql`.

**Re-run staff/partner only:**

```bash
NEXTAUTH_URL=http://127.0.0.1:3010 E2E_BASE_URL=http://127.0.0.1:3010 E2E_TURNSTILE_BYPASS=1 npm run test:e2e:j56
```

Report: `e2e-test-report.md` · Screenshots: `e2e-screenshots/`

---

**Last verified:** May 17, 2026 (test pipeline + migrations 0011–0017 + DRY P0 + compliance smoke)

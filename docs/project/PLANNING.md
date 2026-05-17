# Hotel Etuna — Production Planning

**Last Updated:** May 17, 2026  
**Program Status:** Phases 1–5 complete (RAG ingested via Qdrant Inference 384d); Phases 6–7 complete (`npm run test:all` green per `TASK.md`)  
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
- **Reconciliation scope (known ops gap):** `GET/POST /api/payments/reconciliation` aggregates **booking-level** cash rows filtered by **check-in date** only — it does not yet include folio cash lines, NamQR desk confirms, or manual off-platform payments (documented; not implemented).

**NamQR desk (live):**
- Staff generate/confirm at `/payments/desk` (`NamQrDeskPanel`)
- `POST /api/payments/namqr/generate`, `POST /api/payments/namqr/confirm`
- Compliance payloads: `lib/compliance/namqr/nrtc-payload.ts`, `standards.ts`; tag 26 IPP via `encodeNamQrPayloadV5` in `lib/services/qr/namqr-core.ts`

**Manual off-platform payments (live):**
- `ManualPaymentService`, `POST /api/payments/manual` (EFT, e-wallet, bank deposit on desk form)
- NamQR bank-app confirm: `NamQrDeskPanel` only (avoids duplicate folio path vs manual form)
- Operator verify after Neon SQL: `npm run test:db:migrations` (`scripts/db/verify-neon-migrations.ts`, checks **0011–0017**)
- NamQR / manual folio settle triggers **payment receipt email** (`schedulePaymentReceiptEmail`, method `NamQR (bank app)`)
- Pre-merge DB gate: `npm run test:db` (`scripts/db/verify-db.ts`)

**Card — Adumo Virtual (hosted page, preferred):**
- Guests pay on Adumo’s PCI page; we validate `_RESPONSE_TOKEN` JWT (signature + `mref` / `amount` / `cuid` / `auid`)
- `AdumoVirtualService` → `POST /api/payments/virtual/initiate` (alias `/api/payments/adumo/initiate`)
- Return URLs: `/payment/success`, `/payment/failed`; webhook: `POST /api/webhooks/adumo`
- `payment_sessions` maps `merchantReference` → `bookingId` (`0012_adumo_virtual_payment_sessions.sql`)
- UI: `components/payments/AdumoVirtualPaymentForm.tsx`, `AdumoPaymentReturn.tsx`
- Purposes: `booking_deposit`, `folio_settle` → `completeAdumoVirtualPayment.ts`
- **Wired:** guest folio settle (`AdumoVirtualPaymentForm`, `BookingDepositPayCard` on stay/folio UI)
- **Remaining gap:** public/admin `BookingForm` online checkout deposit (not folio)
- **RealPay:** not in scope (no partner payout or EnDO product)
- **Enterprise API** (`AdumoEnterpriseService`): deprecated for guest flows
- **Go-live:** live `ADUMO_*` credentials, Adumo portal payment page branding, one live test transaction

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
- **Proposal & SLA (legal draft):** `docs/BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md` — counsel review before signature.

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
| **FICA / AML** | `aml_*`, STR APIs, KYC UI | G-05 FIC filing |
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
**Status:** Complete per `TASK.md` (Vitest + `verify:production`; Playwright gated-pricing/public-components)

**Delivered:**
1. Playwright: gated pricing, `PublicHero`/`PublicFooter`, auth redirect behavior
2. Integration coverage for review approval endpoints
3. Sofia/email suite FK fixes
4. Gates: `npm run test:all` (or `test:db` + `vitest run` + `test:smoke`), `npm run verify:production`, optional `npm run test:e2e`

#### Phase 7 — Cleanup/Docs ✅
**Status:** Complete per `TASK.md`

**Delivered:**
1. Obsolete ad-hoc scripts removed; use `scripts/db/*`, Vitest, Playwright
2. Planning docs consolidated (`docs/project/`)
3. PRD, PLANNING.md, and TASK.md aligned (May 16, 2026)
4. `SYSTEM_DESIGN_MASTER_GUIDE.md` reflected in PRD §6.6 / §4.3.2 / §11.5–11.6, PLANNING architecture sections, TASK security checklists

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
- 5 room types (Standard, Luxury, Family, Executive Suite, Premier)
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
- [ ] Playwright e2e tests: `npm run test:e2e` (separate from verify script)

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
- "What room types are available?" → Should list 5 room types

---

## Brand Copy Strategy (`lib/copy/`)

**PRD:** §7.6  
**Strategy:** `docs/REBRAND_QUESTIONNAIRE_AND_LANDSCAPE.md`

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

**Last verified:** May 17, 2026 (test pipeline + migrations 0011–0017 + DRY P0 + compliance smoke)

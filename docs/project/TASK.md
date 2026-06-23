# Hotel Etuna — Task & Production Tracker

**Status:** **Production Live** — core platform complete; RAG via Qdrant inference (`npm audit`: see `PROJECT_STATE.md`)  
**Last Updated:** June 16, 2026 — migration `0065` on Neon; dead-code pass; `test:ci` green; Playwright gate in progress  
**Production URL:** https://www.hoteletuna.com (canonical; apex `https://hoteletuna.com` should redirect — Vercel Domains)

---

## DRY/KISS audit tracker (June 2026)

**Canonical log:** `docs/audit/CODEBASE_AUDIT_2026-06-16.md` (E2E + dead code + `0065`); prior wave: `docs/audit/CODEBASE_AUDIT_2026-06-10.md` §9.

| Archon project | `9ee6b16d-837d-444a-af2d-b49584ee19ec` (Hotel Etuna — Content & Brand OS) |
|----------------|-------------------------------------------------------------------------------|
| Tasks API | ❌ `manage_task` / `find_tasks` broken — use **documents** instead |
| Execution note | Archon doc: *DRY/KISS Audit Execution — 2026-06-11* |
| Validation guide | Archon doc: *DRY/KISS Audit — Validation & Archon Workflow* (`e96d4b56-a9f2-496b-98c3-e91190f3aeed`) |
| RAG refresh | After audit edits: `ARCHON_URL=http://localhost:8181 ./scripts/archon/sync-content-knowledge.sh` |

**Validated 2026-06-11 (wave 5):** `tsc` clean; 35/35 NamQR + accounting + SOC2 unit tests; C8/C9/D1/B1–B3 complete (see audit §9).

**Security (2026-06-11):** Security Prompt Pack executed — preflight **100%** (`compliance/evidence/security/preflight-2026-06-11.json`); see audit §11.

**Next backlog (operator-only):** MFA org screenshots (IMP-05), Adumo **production** portal sign-off (IMP-04), vendor SOC attestations, BCP tabletop results (15 Jun 2026). Code backlog: LangChain major bump when Sofia graph migration scheduled.

**Done 2026-06-11 (wave 6):** CSP; RLS verify; D1 split; Dependabot; `security:audit-report`; **`npm run validate:audit-wave6`** (**9 pass**, 1 warn `enable:pgaudit`); IMP-01 **compensating controls** (`verify:pgaudit` exit 0).

**Production verification (2026-06-11):** `npm run verify:production` ✅ — **808** Vitest + **6** smoke + `next build`; Sofia `getConversationHistory` delegate fix.

**SOC 2 orchestrator (2026-06-11):** `npm run validate:soc2` ✅ — all steps exit 0; evidence `compliance/evidence/policies/IMPLEMENTATION_VALIDATION_2026-06-11.md`.

---

## Production audit checklist (June 8–9, 2026)

| Step | Status | Evidence |
|------|--------|----------|
| S1 Baseline gates (tsc / build / db migrations) | ✅ | `tsc` 0 errors; `npm run build` green; Neon **50/50** migration checks (`0055`–`0060` applied) |
| S3 Fix duplicate migrations | ✅ | 52 files `0000`–`0060`; journal aligned; `docs/project/MIGRATION_MASTER.md` |
| S4 Replace mock/placeholder prod data | ✅ | Platform analytics → Neon aggregates; fraud rule editor; payroll in-repo |
| S5 Security hardening (verified only) | ✅ | Hub team RBAC; `/staff` + `/payroll` owner-only; PIS step-up 2FA per PSD-12 |
| Hub team provision | ✅ Script | `npm run provision:hotel-team` — founder/admin/frontdesk/marketing/support @hoteletuna.com |
| Introducer seed | ✅ Script | `npm run seed:introducers` — CRM + public directory samples |
| S6 Re-validate `verify:production` | ✅ | `npm run verify:production` green (June 9, 2026) |
| Frontend intent map | ✅ | `PLANNING.md` § Frontend intent & RBAC map; `compliance/validation_2026-06-09.md` |

---

## DOMAIN_COMPLETION_MATRIX (June 9, 2026)

| # | Domain | Status | Evidence |
|---|--------|--------|----------|
| 1 | Staff / HR | ✅ | `/staff/[id]/edit`, `/schedule`; `StaffService` salary persist |
| 2 | Payroll (Namibia) | ✅ | `0055`–`0057`; `/payroll`; PAYE/SSC exports; `namibia-payroll.test.ts` |
| 3 | Bookings / deposits | ✅ | `0060` `deposit_percent`; `resolveBookingDepositAmount` |
| 4 | Partner commission | ✅ | `/reports/commission`; `GET /api/reports/commission` |
| 5 | Reconciliation | ✅ | Cash-up API + desk UX; PLANNING § reconciliation v1 |
| 6 | Accounting / VAT | ✅ | `JournalEntryService` TS-clean; period close tests |
| 7 | Fraud | ✅ | `FraudRuleEditor`; `PATCH /api/fraud/rules` |
| 8 | F&B / kitchen | ✅ | Regression — print jobs `0011` |
| 9 | Housekeeping | ✅ | Guest request → HK task (`GuestServiceRequestService`) |
| 10 | CRM / introducers | ✅ | `seed:introducers`; CRM CRUD |
| 11 | Guests / DSAR | ✅ | `/guest/dsar`; `dsar-workflow.test.ts` |
| 12 | Payments Adumo/NamQR | ✅ Partial | Live `ADUMO_*` ops-dependent |
| 13 | Open banking PIS | ✅ Partial | APIs + BON routes; guest PIS on `GuestFolioPanel` (2026-06-10) |
| 14 | Platform admin | ✅ | `PlatformAnalytics` → `/api/admin/platform/analytics` |
| 15 | Compliance / KYC | ✅ | AML dashboards; KYC cases API; STR workflow |
| 16–20 | Sofia, partners, auth, rooms, CMS | ✅ | Shipped — regression pass |
| Phases 8–12 vision | ⏸️ | Separate program — TASK § Agentic CRM |

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

## Room inventory & facilities booking (June 2026)

| Area | Status |
|------|--------|
| Data | `lib/data/hotel-etuna-room-inventory.ts` — 35 guest rooms + 1 conference hall + 1 campsite (no guest room numbers on facilities) |
| Migrations | `0040`–`0042` applied via `npm run db:migrate:all` |
| Public UI | `getHubRoomTypeCatalog()` on `/`, `/rooms`; `/facilities/conference`, `/facilities/campsite` |
| Booking | `FacilityBookingPricing`, `createFacilityBooking`, `POST /api/bookings` discriminated by `bookingKind` |
| Docs | PRD § Room & facility inventory, PRD §3.3 |
| RAG | `npm run rag:seed` after knowledge markdown changes |

---

## Agentic CRM & Intelligent OS (Vision) — June 8, 2026

**Source:** PRD §1.1 (vision + 5 goals), §8.1 (KPIs), §13 Phases 8–12. **Architecture:** PLANNING § Agentic CRM & Intelligent OS roadmap. Forward‑looking — none started. ~16 weeks, parallel tracks possible; each phase ships independent value. **Guardrails unchanged:** Neon+Drizzle, NextAuth/Stack, Adumo Virtual+NamQR+cash, hub‑and‑spoke RLS, Sofia hub‑exclusive, `security:preflight` gate.

> Before starting any phase: claim migration numbers in `docs/MIGRATION_MASTER.md`; add 1 happy‑path + 1 edge + 1 failure test per new utility/endpoint; run `npm run test:ci` before marking complete.

### Phase 8 — Guest command centre (core) · 4 weeks · `app/guest/*`
- [x] Magic‑link welcome email + passwordless guest hub entry (pre‑arrival) — **2026-06-10** (`0062`, `GuestHubMagicLinkService`, `/guest/welcome`, Sofia SMTP)
- [x] Document vault — encrypted (AES‑256) ID/visa upload — **2026-06-10** (`0063`, `GuestDocumentVaultCard`; auto‑attach to future stays deferred)
- [ ] Room selection on check‑in date (pick exact room number from the available-rooms list — **no floor plan**)
- [ ] Digital check‑in: registration, **in-app e‑signature of terms** (legally valid under the **Electronic Transactions Act 4 of 2019** — no external e‑sign vendor required), deposit pay (Adumo Virtual)
- [x] In‑stay service request (towels, turndown, iron) → routed to housekeeping task — **existing** (`0054`, `GuestServiceRequestCard`)
- [x] Maintenance report (photo + description) → creates staff ticket — **existing** (maintenance request type → housekeeping task)
- [ ] Upgrade/downgrade with pro‑rated charge/refund
- [ ] Guest ↔ front desk messaging (Sofia first, human escalation)
- [x] Folio as a hub **widget** (reuse `FolioService`), not a separate page — **existing** (`GuestFolioPanel` + PIS panel **2026-06-10**)
- [ ] Post‑stay: auto‑checkout summary, loyalty credit, feedback survey, 30‑day re‑engagement
- [ ] Agentic actions: birthday surprise, repeat‑guest recognition, weather nudge, silent loyalty upgrade

### Phase 9 — Staff intelligence layer · 4 weeks · `app/(dashboard)/*`
- [x] Real‑time command‑centre dashboard (occupancy/arrivals/departures/orders/revenue, auto‑refresh via poll) — ✅ `CommandCentreService` + `/api/dashboard/command-centre` + `/command-centre` (45s poll), Sidebar → Operations
- [x] Colour‑coded smart alerts (🔴 urgent / 🟡 attention / 🟢 info) with prioritisation — ✅ `command-centre-alerts.ts` (pure, tested) rendered in the command centre
- [ ] Voice commands (Sofia tool calls): "mark room clean", "show today's arrivals"
- [ ] Predictive housekeeping assignment from checkout times + historical clean duration
- [ ] Maintenance auto‑routing to the right technician (plumbing/electrical/HVAC)
- [ ] Revenue intelligence: ADR vs market rate suggestion, one‑click manager approve
- [x] Low‑stock **reorder recommendation** on `InventoryService` (suggested → admin/front‑desk approves; never auto‑ordered) — ✅ `ReorderRecommendationService` + `/api/intelligence/reorder-recommendations` + `/intelligence` queue (migration 0067)
- [ ] Mobile‑first PWA + push notifications (existing service worker); offline action queue

### Phase 10 — Sofia co‑pilot (proactive) · 3 weeks · hub‑exclusive
- [ ] Proactive nudges from guest behaviour (e.g. pre‑order breakfast + wake‑up call)
- [ ] Sentiment detection → immediate human handover on negative signal
- [ ] Multi‑channel context unification (web ↔ WhatsApp ↔ email ↔ voice)
- [ ] Language auto‑detection (EN/DE/FR/Oshiwambo)
- [ ] Layered memory: session + long‑term (`crm_guest_memory_facts`/`crm_graph_edges`) + episodic; optional Mem0 mirror
- [ ] Automatic fact extraction with confidence; trigger actions (e.g. peanut allergy → alert kitchen)
- [ ] Autonomous revenue actions: upgrade offer, late‑night dining, complaint remediation voucher (manager approval optional)

### Phase 11 — Intelligent OS (analytics & automation) · 3 weeks · `lib/services/*`, `lib/cron/`
- [x] Rate **recommendation** engine → writes suggestions to a review queue; **admin or front desk must approve before any rate change. Never auto‑applied.** — ✅ `RateRecommendationService` (approve applies `rooms.base_rate` + audit) + `/api/intelligence/rate-recommendations` + `/intelligence` queue + nightly `cron/recommendations` (migration 0067)
- [x] Forecasting: occupancy, ADR, RevPAR for next 30/90 days — ✅ `ForecastingService` (in‑house, on‑the‑books; TS heuristic — FPP3 R models can't run in our stack), AI rationale via Sofia with deterministic fallback
- [x] Smart inventory: F&B reorder (→ approval-gated `ReorderRecommendationService`, migration 0067). ↳ remaining: linen/amenity replacement prediction, minibar auto‑bill
- [x] Predictive maintenance from complaint history (flag repeat issues for inspection) — ✅ `MaintenanceInsightsService` + `/api/intelligence/maintenance-insights` + `/intelligence` "Maintenance to inspect" panel (watch/inspect severity from repeat `guest_service_requests`)
- [x] Compliance automation: POPIA anonymisation jobs, PCI boundary check, immutable audit coverage — ✅ existing `RetentionEnforcementService` + `SofiaChatRetentionService` + `cron/retention-enforcement`; PCI boundary via `security:preflight`; immutable audit via `audit_trail` hash-chain (0047)

### Phase 12 — UX polish & performance · 2 weeks
- [x] Design‑system audit vs PLANNING § Frontend design system (palette, pill buttons, cards) — airy `etuna-*` pass 2026-06-18
- [ ] Skeleton loaders on all async surfaces; micro‑transitions on modals/toasts
- [ ] Offline‑first: service‑worker cache, offline banner, IndexedDB action queue
- [ ] Keyboard shortcuts for staff dashboard (G bookings, H housekeeping, P payments)
- [ ] WCAG 2.1 AA: contrast, focus indicators, ARIA, skip links; 375px mobile pass

### Vision KPIs to instrument (PRD §8.1)
- [ ] `/guest` hub adoption (target >70%), digital check‑in usage (>50%)
- [ ] Upsell revenue per guest (N$150), staff minutes saved/shift (90), RevPAR (+20%)
- [ ] Sofia resolution rate (>85%), first‑response time (<30s), NPS (>70)

---

## OSS porting waves (June 2026)

**Reference:** `PLANNING.md` § Dispatch agents & OSS porting (per-repo study index + dispatch surface) · OSS clones: `buffr-host/source-codes/` (study only — never import at runtime). The standalone mining reference and Wave-7 porting log were folded into PLANNING/TASK on 2026-06-08 (DRY).

| Wave | Scope | Owner | Status |
|------|--------|-------|--------|
| **W1** | F&B kitchen board + print dispatch (`QRMeal` / `OpenKDS` patterns) | Agent | ✅ VERIFIED |
| **W2** | Payment FSM + transactional outbox (`Aegispay` patterns) | Agent | ✅ |
| **W3** | Tamper-evident audit hash chain (`trailkit` patterns) | Agent | ✅ |
| **W4** | GL period close + journal table UI (`dubbl` patterns) | Agent | ✅ |
| **W5** | Folio void + night audit (`pura-pms`) | Agent | ✅ |
| **W6** | Availability ledger + property switcher (`innkeeper` / `pesan-pms`) | Agent | ✅ |
| **W7** | Sofia pipeline + LangGraph tools (`JackTheButler` / `langgraphjs`) | Agent | ✅ |
| **W8** | Cal.com webhooks + Inngest cron (`cal.com` / `inngest-js`) | Agent | ✅ |

### W1 — F&B print dispatch & kitchen board

- [x] `lib/services/fnb/fnb-print-dispatch-service.ts`
- [x] `lib/adapters/print/network-print-adapter.ts` (mock + hook)
- [x] Migration `0045_fnb_print_jobs.sql` wired in `apply-all-missing-migrations.ts`
- [x] `app/api/fnb/print-jobs/route.ts` + `[id]/status/route.ts`
- [x] `components/features/fnb/kitchen-ticket-board.tsx`
- [x] `app/(dashboard)/restaurant/kitchen/page.tsx`
- [x] `tests/integration/fnb/` (service + API)
- [x] Wire from `OrderService` on order submit

### W2 — Payment state machine & outbox

- [x] `lib/services/payment/paymentStateMachine.ts`
- [x] `lib/services/payment/paymentOutbox.ts`
- [x] Migration `0046_payment_outbox_events.sql`
- [x] Integrate with `completeAdumoVirtualPayment.ts` (FSM + outbox receipt email; NamQR flows deferred)
- [x] Cron or route: outbox dispatch (`app/api/cron/payment-outbox-dispatch/route.ts`)
- [x] `tests/unit/payment-state-machine.test.ts`

### W3 — Audit hash chain

- [x] `lib/compliance/AuditHashService.ts`
- [x] Migration `0047_audit_trail_hash_chain.sql`
- [x] `app/api/compliance/audit-chain/verify/route.ts`
- [x] `components/features/compliance/AuditChainVerifyCard.tsx` in SOC2 panel
- [x] `tests/unit/audit-hash-chain.test.ts`

### W4 — Accounting period close

- [x] `GlPeriodCloseCard.tsx`, `JournalEntryTable.tsx`
- [x] Extend `HospitalityAccountingService` with period-close guard
- [x] API routes under `app/api/reports/accounting/`
- [x] Tests for draft-entry block on close

### W6 — Availability ledger + property switcher

- [x] Migration `0051_availability_ledger.sql` + `room_availability_ledger` in `lib/db/schema.ts`
- [x] `lib/services/property/AvailabilityLedgerService.ts`
- [x] Extend availability ledger + bookings (`AvailabilityLedgerService` + `booking/AvailabilityService`; removed unused `property/AvailabilityService` in DRY pass 2026-06-10)
- [x] `components/features/property/PropertySwitcher.tsx` wired in `Header.tsx`
- [x] `components/providers/ActivePropertyProvider.tsx` in dashboard layout
- [x] `components/features/property/AvailabilityLedgerPanel.tsx`
- [x] `app/api/properties/availability-ledger/route.ts` (GET/PATCH)
- [x] `app/(dashboard)/properties/availability/page.tsx`
- [x] `tests/unit/availability-ledger-service.test.ts`

### W7 — Sofia pipeline + LangGraph tool graph

- [x] `database/drizzle/0052_sofia_pipeline_runs.sql`
- [x] `lib/db/schema.ts` — `sofiaPipelineRuns`
- [x] `lib/ai/agent-registry.ts` — concierge, night-audit, outreach agents
- [x] `lib/workflows/sofiaToolGraph.ts` — `searchRag`, `getGuestProfile`, `checkAvailability`
- [x] `SofiaPipelineService.process()` — `SOFIA_TOOL_GRAPH_ENABLED` on WEB channel
- [x] `lib/services/ai/sofia-concierge-handler.ts` — pipeline primary path
- [x] Best-effort persist to `sofia_pipeline_runs`
- [x] `tests/unit/sofia-tool-graph.test.ts`

### W8 — Cal.com webhooks + durable scheduler cron

- [x] Migration `0053_cal_booking_mirrors.sql` + `0049` wired in `apply-all-missing-migrations.ts`
- [x] `lib/db/schema.ts` — `calBookingMirrors`, `schedulerJobs`, `notificationHistory`
- [x] `lib/services/scheduling/CalWebhookService.ts` — HMAC verify + idempotent upsert
- [x] `lib/services/notifications/NotificationDispatchService.ts` — preferences + `notification_history`
- [x] `app/api/webhooks/cal/route.ts` — POST Cal.com webhook
- [x] `app/api/cron/scheduler-dispatch/route.ts` — `CRON_SECRET` + `dispatchPending()`
- [x] `lib/services/scheduling/schedulerJobHandlers.ts` — night-audit, payment-outbox-dispatch, intelligence-digest
- [x] `vercel.json` — cron for `scheduler-dispatch`
- [x] `.env.example` — `CAL_WEBHOOK_SECRET`, `SOFIA_TOOL_GRAPH_ENABLED` optional
- [x] `tests/unit/cal-webhook-service.test.ts`, `tests/unit/durable-scheduler.test.ts`

### W5 — Folio void + night audit + reservation SM

- [x] `database/drizzle/0050_night_audit_runs.sql` + `nightAuditRuns` in `lib/db/schema.ts`
- [x] `NightAuditService.runAudit` persists to `night_audit_runs` (idempotent upsert)
- [x] `components/features/folio/FolioVoidTransactionDialog.tsx` (reason codes)
- [x] `components/features/booking/NightAuditPanel.tsx` + `/bookings/night-audit` page
- [x] `app/api/bookings/night-audit/route.ts` (owner/manager)
- [x] `app/api/folio/charges/[id]/void/route.ts`
- [x] `BOOKING_STATUS_TRANSITIONS` + `ReservationStateMachine` — `assigned`, `stayover`, `due_out`
- [x] `BookingService.transitionBookingStatus` uses `assertTransition`
- [x] `lib/ai/agent-registry.ts` — `NIGHT_AUDIT_AGENT` + `FOLIO_OPS_AGENT`
- [x] `tests/unit/night-audit-service.test.ts`, `tests/integration/folio-void-api.test.ts`
- [x] Wired void dialog in `BookingFolioSection`; night audit link on bookings hub

### W6 — Availability ledger + property switcher

- [x] Migration `0051_availability_ledger.sql`
- [x] `AvailabilityLedgerService.ts`, `PropertySwitcher.tsx`, `AvailabilityLedgerPanel.tsx`
- [x] `app/api/properties/availability-ledger/route.ts`
- [x] `app/(dashboard)/properties/availability/page.tsx`
- [x] `tests/unit/availability-ledger-service.test.ts`

### W7 — Sofia pipeline + LangGraph

- [x] Migration `0052_sofia_pipeline_runs.sql`
- [x] `lib/workflows/sofiaToolGraph.ts`, `lib/ai/agent-registry.ts`
- [x] `SofiaPipelineService` + `sofia-concierge-handler` wiring
- [x] `tests/unit/sofia-tool-graph.test.ts`

### W8 — Cal.com + durable scheduler

- [x] Migrations `0049_durable_scheduling_notifications.sql`, `0053_cal_booking_mirrors.sql`, `0054_guest_service_requests.sql`
- [x] `CalWebhookService.ts`, `NotificationDispatchService.ts`, `schedulerJobHandlers.ts`
- [x] `app/api/webhooks/cal/route.ts`, `app/api/cron/scheduler-dispatch/route.ts`
- [x] `tests/unit/cal-webhook-service.test.ts`, `tests/unit/durable-scheduler.test.ts`

**Rule:** Never import from `buffr-host/source-codes/*` at runtime.

**Migrations:** Run `npm run db:migrate:all` — applies `0003` through `0054` (canonical journal in `database/drizzle/meta/_journal.json`; see `docs/project/MIGRATION_MASTER.md`).

---

## Production hardening (June 2026)

| Area | Status |
|------|--------|
| Nav / RBAC | Risk nav removed for staff; `/crm` link; `proxy.ts` routes; `/dashboard/rooms` removed |
| Buffr Hub | AI observability + secrets pages; intelligence digest preview on platform overview |
| PEP screening | **Out of scope** — no Namibia PEP database; `PEPScreeningService` + `/api/compliance/aml/pep/screen` removed; dormant `aml_pep_*` schema only; see `AML_FICA_COMPLIANCE_PROGRAM.md` §8 |
| Migrations | Journal `0000`–`0061` (no duplicate sequence numbers); `npm run db:generate:all-sql`; verify through `0061` (`0061` = `payment_disputes`) |
| Payment disputes | `0061_payment_disputes.sql`; `PaymentDisputeService` (folio-reversing, idempotent); Adumo webhook → `openDispute`; `/payments/disputes` desk |
| NamQR confirm re-check | `confirmDeskPayment` re-validates the stored NamQR before settling — dynamic codes must settle for their encoded amount (1c tolerance); expired/deactivated codes rejected. Pure check `checkNamQrSettlement` + `tests/unit/namqr-settlement-recheck.test.ts` |
| Migration `0044` data hygiene | Normalizes legacy/out-of-range `rooms.status` + `rooms.inventory_kind` before adding CHECK constraints (a single bad row previously failed the whole migration) |
| Intelligence | `IntelligenceReportService`, cron digests, `FOUNDER_DIGEST_EMAIL`, partner weekly via `users.notification_preferences` |
| Email | Zod schemas in `lib/validation/sofia-email-schemas.ts`; `npm run validate:email-templates` in `test:ci` |
| Docs | **Consolidated to 3 SoT (PRD / PLANNING / TASK) on 2026-06-08**, all under `docs/project/` (root stubs removed). Folded + deleted: AUDIT_FINDINGS, FRONTEND_AUDIT, REBRAND questionnaire, FNB_PRINT_DISPATCH_PORT, ROOM_INVENTORY, SOURCE_CODES_ETUNA_MINING_REFERENCE, WAVE_7_PORTING_LOG, SOC2_IMPLEMENTATION_SUMMARY, BUFFR proposal. Kept: `docs/compliance/**`, `docs/naming-conventions.md`, `docs/SECURITY_PROMPT_PACK.md`, `SOC2_IMPLEMENTATION_PLAN.md`. |

---

## Production gaps (to close before / shortly after go-live)

Consolidated from the 2026-06-02 documentation audit and the legacy cleanup list.
Open items only — completed audit fixes (README/gemini/CLAUDE corrections, AI usage
policy, vendor register, openapi.yaml, BCP/IRP policy stubs) are done and dropped.

| # | Gap | Type | Owner | Notes |
|---|-----|------|-------|-------|
| 1 | ~~IRP contacts~~ — **PARTIAL:** IC + tech lead filled in `INCIDENT_RESPONSE_PLAN.md` §3.1; legal liaison TBC | Compliance | CTO | counsel appoint before audit |
| 2 | Executive sign-off on all SOC 2 policies (signatures) in `docs/compliance/policies/` | Compliance | CEO/CTO | 22 drafted; template + impl validation 2026-06-10 (`compliance/evidence/policies/`); signatures missing |
| 3 | BCP tabletop — **scheduled 15 Jun 2026** (`docs/compliance/incidents/tabletop-2026-06-15.md`); complete results after exercise | Compliance | CTO | scheduled |
| 4 | Reconcile SOC 2 budget contradiction (N$50–150K vs N$250–300K) in `SOC2_IMPLEMENTATION_PLAN.md` | Compliance | CEO | internal inconsistency |
| 5 | ~~Add `DATA_PROTECTION_POLICY.md` revision history + approval block~~ — **DONE** 2026-06-02; full pack template conformance 2026-06-10 | Compliance | CTO | ✅ |
| 6 | Verify `pgAudit` enabled on Neon (Logging Policy says "where available") | Infra | Dev | not confirmed live |
| 7 | Add `DATABASE_URL_UNPOOLED` to `.github/workflows/soc2-evidence.yml` if collector needs direct queries | CI | Dev | verify script requirements |
| 8 | ~~Hub commission reporting~~ — **DONE:** `/reports/commission`, `GET /api/reports/commission` | Feature | Dev | ✅ June 9 |
| 9 | ~~Public Adumo deposit checkout wiring~~ — **DONE 2026-06-08:** `LandingBookingWidget` now creates a booking + redirects to deposit page; `BookingForm` envelope-parse bug fixed; orphan `features/rooms/RoomBookingCard.tsx` deleted; shared `extractBookingId` helper. **Remaining:** live `ADUMO_*` creds + branded portal (ops); deposit defaults to full `totalAmount` (see #17). | Payments | Dev | core money loop now works |
| 10 | Guest self-scan NamQR on folio | Feature | Dev | desk flow live; guest scan deferred |
| 11 | Open Banking PIS | Feature | Dev | **Partial:** APIs + guest `GuestOpenBankingPisPanel` (2026-06-10); full OAuth bank linking deferred |
| 12 | DSAR end-to-end (consumer rights) hardening | Feature | Dev | `consumer_rights_requests` + `/guest/dsar` exist; verify full flow |
| 13 | Frontend polish: skip links, contact-page map embed + social links | Frontend | Dev | low priority (from frontend audit) |
| 14 | ~~Delete unused `MenuPageTurner.tsx` + `page-static-backup.tsx`~~ | Cleanup | Dev | ✅ Removed from tree (2026-06-10 audit) |
| 15 | Migrate residual `getServerSession` callers to `withApiAuth` | Tech debt | Dev | migrate over time |
| 16 | ~~P0 build red~~ — **RESOLVED 2026-06-09:** `tsc` 0 errors; `npm run build` green; integration tests fixed (`audit-chain`, `accounting-period-close`) | Build blocker | Dev | ✅ closed |
| 17 | ~~Deposit fraction~~ — **DONE:** `0060` `deposit_percent`; `lib/booking/deposit.ts` | Payments | Dev | ✅ June 9 |

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
| Browser SDK | `posthog-js` **^1.373.5** (dependency) | PostHog MCP project **341765** — ingestion active |
| React bindings | `@posthog/react` **^1.9.0** | `PostHogProvider` wraps app in `app/layout.tsx` |
| Early init | `instrumentation-client.ts` | Next.js 16 client instrumentation |
| Shared options | `lib/posthog-client-options.ts` | `defaults: '2026-01-30'` → SPA `history_change` pageviews |
| Client helpers | `lib/posthog.ts` | `trackEvent`, `identifyUser`, feature flags |
| Server capture | `lib/monitoring/posthog-server.ts` | `captureServerException` (API routes) |
| Env | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Optional `POSTHOG_PROJECT_API_KEY` for server |

**MCP snapshot (2026-06-11):** ~213 `$pageview` / 30d (test hosts filtered); **4** active low-volume error issues (ChunkLoad + RSC digest — typical post-deploy). Session replay off. See `PROJECT_STATE.md` § PostHog.

Docs: [Next.js library](https://posthog.com/docs/libraries/next-js) · [SPA pageviews](https://posthog.com/tutorials/single-page-app-pageviews)

### Playwright (E2E)

| Item | Detail |
|------|--------|
| Package | `@playwright/test` **^1.60.0** |
| Viewport projects | `chromium`, `mobile-chrome` (Pixel 5), `tablet` (iPad gen 7) — `playwright.config.ts` |
| Specs | **12** files under `e2e/` + `global-setup.ts`, helpers (`login`, `dismiss-cookie-consent`, `db-otp`) |
| Config (2026-06-16) | `globalSetup` warms `/api/health` + `/`; per-test `timeout: 120s`; turbo `webServer` with `E2E_TURNSTILE_BYPASS=1`; `PLAYWRIGHT_REUSE_SERVER=1` to attach to existing `:3010`; kill stale `:3010` before full run |
| Gate status | ⚠️ **291 tests** — fresh run started 2026-06-16; prior run failed ~94/291 when dev server crashed (`ERR_CONNECTION_REFUSED`) |
| Scripts | `test:e2e`, `test:e2e:desktop`, `test:e2e:mobile`, `test:e2e:tablet`, `test:e2e:responsive`, `test:e2e:install:all` |

`responsive-layout.spec.ts`: horizontal overflow on `/`, `/rooms`, `/dining`, `/contact`; mobile nav toggle (mobile project). Not part of `verify:production` — run manually before major UI releases.

### Test run (2026-06-16 — audit completion)

| Step | Command | Result |
|------|---------|--------|
| Typecheck | `npx tsc --noEmit` | ✅ 0 errors |
| Migrations | `npm run test:db:migrations` | ✅ **55/55** — `0065_tenant_whatsapp_openwa` on Neon (`red-violet-85049608`) via MCP |
| Unit + integration | `npm test` | ✅ **811** passed, **2** skipped |
| Compliance smoke | `vitest run --config vitest.smoke.config.ts` | ✅ **6/6** |
| Document wiring | `npm run validate:document-wiring` | ✅ (payments desk `#documents` link restored) |
| Full CI gate | `npm run test:ci` | ✅ green |
| Playwright E2E | `npx playwright test` | ⚠️ in progress — see Playwright table above |

### Test run (2026-06-11 — production verification)

| Step | Command | Result |
|------|---------|--------|
| Typecheck | `npx tsc --noEmit` | ✅ 0 errors |
| DB health | `npm run test:db` | ✅ pass |
| Migrations | `npm run test:db:migrations` | ✅ **55/55** through `0065` (Neon applied 2026-06-16) |
| Unit + integration | `npm test` (`vitest run`) | ✅ **808** passed, **2** skipped (**107** files) |
| Compliance smoke | `vitest run --config vitest.smoke.config.ts` | ✅ **6/6** |
| Wave 6 gates | `npm run validate:audit-wave6` | ✅ **9 pass**, 1 warn (`enable:pgaudit`) |
| pgAudit IMP-01 | `npm run verify:pgaudit` | ✅ compensating controls |
| Security preflight | `npm run security:preflight` | ✅ **12/12**, 100% |
| Full production gate | `npm run verify:production` | ✅ `tsc` + `test:ci` + `build` (~6 min) |
| PostHog unit | `npx vitest run tests/unit/posthog-analytics.test.ts` | ✅ **4/4** |

**Playwright E2E:** not in `verify:production` (requires dev server on `:3010`). Operator: `npm run test:e2e:responsive` after `npm run dev -- -p 3010`.

### Test run (May 17, 2026 — after PostHog/Playwright update) — superseded by table above

**Project tree (regenerate):**

```bash
tree -I 'node_modules|.next|.git|coverage|playwright-report|test-results|.claude' --dirsfirst -F --charset ascii > docs/project/TREE.txt
```
Full listing (all levels, ~1610 lines): **`docs/project/TREE.txt`** — regenerated June 2026.

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
| Operator SQL 0011–0017 | `npm run test:db:migrations` | ✅ **18/18** on Neon (incl. `0016` fraud rules, `0017` ai_conversations index) |
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
- [ ] **Executive kick-off meeting** — Review plan, approve N$250K-300K budget
- [ ] **Team formation** — Assign Program Lead (CTO), Technical Lead (Dev), Compliance Liaison (Ops)
- [ ] **Gap analysis workshop** — Walk through TSC Common Criteria checklist
- [ ] **CPA firm RFP** — Get quotes from Deloitte, PwC, KPMG Namibia
- [ ] **Project tracker setup** — Gantt chart in Notion/Asana/Sheets

#### Week 3: Risk Assessment
- [ ] **Document risk assessment methodology** — NIST 800-30 lite
- [ ] **Run initial risk assessment** — Identify top 10 risks
- [ ] **Create risk register** — Track in spreadsheet
- [ ] **Executive review** — Present risk findings

#### Week 4: Security Policies (Critical Path)
- [x] **Write 21 core policies** — `docs/compliance/policies/` (May 17, 2026); pending CEO sign-off
  - [x] Information Security Policy (DONE)
  - [x] Access Control Policy
  - [x] Acceptable Use Policy
  - [x] Change Management Policy
  - [x] Data Classification Policy
  - [x] Data Retention Policy
  - [x] Vendor Management Policy
  - [x] Asset Management Policy
  - [x] Cryptography Policy
  - [x] Password Policy
  - [x] Remote Access Policy
  - [x] Physical Security Policy
  - [x] Network Security Policy
  - [x] Logging & Monitoring Policy
  - [x] Backup Policy
  - [x] Data Protection Policy (+ `DATA_PROTECTION_POLICY_NAMIBIA.md`)
  - [x] HR Security Policy
  - [x] Training Policy
  - [x] Code of Conduct
  - [x] Business Continuity Policy
  - [x] AI Usage Policy (2026-06-02)
  - [x] Incident Response Policy
  - [x] Template conformance + implementation validation (2026-06-10) — `compliance/evidence/policies/IMPLEMENTATION_VALIDATION_2026-06-10.md`
- [ ] **Executive sign-off** — CEO/Owner approves all policies (`SIGN_OFF_CHECKLIST.md`)

#### Week 5: Incident Response
- [x] **Complete Incident Response Plan** (DONE)
- [ ] **Conduct tabletop exercise** — Simulate payment breach scenario
- [ ] **Document exercise results** — `docs/compliance/incidents/tabletop-YYYY-MM-DD.md`

#### Week 6: Centralized Logging
- [ ] **Enable Neon pgAudit** — `CREATE EXTENSION pgaudit;`
- [ ] **Verify audit_trail retention** — No DELETE operations on audit tables
- [ ] **Optional: Vercel log export** — S3 bucket for 90-day retention (~$50/month)
- [ ] **Log review process** — Weekly CTO review; document in `docs/compliance/log-reviews/`

#### Week 7: Business Continuity Plan
- [ ] **Document BCP** — `docs/compliance/BUSINESS_CONTINUITY_PLAN.md`
- [ ] **Define recovery procedures** — Neon restore, Vercel redeploy, failover drills
- [ ] **Schedule quarterly restore test** — Add to calendar

#### Week 8: Vendor Risk Management
- [ ] **Request SOC 2 reports** — Vercel, Neon, Adumo
- [ ] **Complete vendor risk assessment** — `docs/compliance/VENDOR_RISK_ASSESSMENT_2026.md`
- [ ] **Store attestations** — `docs/compliance/vendor-attestations/*.pdf`

### High Priority — Security Review Process 🛡️
**Owner:** All Developers  
**Reference:** `docs/SECURITY_PROMPT_PACK.md`

#### Continuous Security Reviews (Immediate)
- [ ] **Integrate Security Prompt Pack** — All devs read `SECURITY_PROMPT_PACK.md` § 1-15
- [ ] **Update PR template** — Add security checklist from § 14 (Master Security Review)
- [ ] **Add pre-deploy hook** — Run § 15 (Deployment Pre-Flight) before `vercel deploy --prod`
- [ ] **Team training** — 1-hour walkthrough of Security Prompt Pack sections

#### Weekly Security Tasks
- [ ] **Monday:** Run `npm audit --audit-level=critical` — Fix vulnerabilities or document risk acceptance
- [ ] **Wednesday:** Review `audit_trail` for suspicious patterns — Document in `docs/compliance/log-reviews/`
- [ ] **Friday:** Scan for hardcoded secrets — `git grep -iE "api[_-]?key|secret|password|token" -- '*.ts' '*.tsx' '*.js'`

#### Monthly Security Tasks (Last Business Day)
- [ ] **Export evidence package** — `GET /api/compliance/soc2?action=export` (hub admin)
- [ ] **Update risk register** — Add new risks from incidents or changes
- [ ] **Review API key rotation** — Rotate keys older than 90 days
- [ ] **Security awareness reminder** — Share security tip in team channel

#### Feature Development Security Checklist
For every new feature or significant code change:
1. [ ] Run relevant Security Prompt Pack section:
   - Forms/validation: § 1 (Frontend-Only Validation)
   - Auth/sessions: § 3 (Authentication & Session Security)
   - Permissions: § 4 (Missing Permission Checks)
   - File uploads: § 7 (File Upload Security)
   - API endpoints: § 8 (Rate Limiting & Brute Force)
2. [ ] Run § 14 (The Master Security Review) — Run twice for layered checks
3. [ ] Document security decisions in PR description
4. [ ] Before merge: Code reviewer runs § 14 independently

#### Week 9-10: Evidence Automation
- [ ] **Evaluate Vanta vs manual** — Budget decision (N$30K-40K/year vs free)
- [ ] **If Vanta: Setup integrations** — GitHub, Vercel, Google Workspace
- [ ] **If manual: Create evidence calendar** — Monthly export schedule

#### Week 11-24: Evidence Collection (6-Month Observation)
- [ ] **Monthly evidence exports** — User list, audit logs, git commits, `npm audit` reports
- [ ] **Quarterly risk register updates**
- [ ] **Weekly log reviews** — Document findings
- [ ] **Upload to evidence folder** — `docs/compliance/evidence/YYYY-MM/`

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
- [ ] **npm audit triage** — 0 critical at `--audit-level=critical` (verified May 16); review moderate/high via `npm audit` and document risk acceptance where needed

### Medium Priority
- [ ] **Production smoke** — §0 below on https://www.hoteletuna.com after each deploy
- [ ] **UI enhancements** — RoomCard/ReviewCard extraction; skeleton loaders; khaki focus rings in `globals.css`

### Low Priority
- [ ] **Docker Compose** — Verify with Neon-backed local stack
- [ ] **API documentation guide** — Optional developer reference

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
- [ ] **Pre-launch** — Set Vercel `RATE_LIMIT_REDIS_REQUIRED`, Turnstile keys, run `db:push` + smoke test register → verify → `/guest`
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
- [ ] Bank-file / NamClear auto-reconcile (future)
- [x] Guest NamQR on folio — Option B (QR + bank ref submit; staff approve at `/payments/desk`; migration `0020_namqr_pending_confirmations.sql`)

### SQL Migration Review ✅
- [x] Migrations `0010_booking_charges_rls.sql` and `0021_housekeeping_tasks.sql` reviewed and confirmed correct (June 2026)

### Phase 2b: Adumo Virtual (card) 🚧
- [x] `AdumoVirtualService`, `completeAdumoVirtualPayment`, `payment_sessions` migration
- [x] `POST /api/payments/virtual/initiate`, `/confirm`, `POST /api/webhooks/adumo`
- [x] `AdumoVirtualPaymentForm`, `/payment/success`, `/payment/failed`
- [ ] Run `database/drizzle/0012_adumo_virtual_payment_sessions.sql` on Neon
- [x] Wire `AdumoVirtualPaymentForm` on guest folio settle UI
- [x] Wire `AdumoVirtualPaymentForm` on online booking checkout (deposit) — `/payment/booking-deposit` + `LandingBookingWidget` redirect (2026-06-10)
- [ ] Staging test: Visa `4000000000001091` (3DS app UID)
- [ ] Live Adumo credentials + portal branding; production smoke on `hoteletuna.com`
- [ ] Confirm with Adumo: settlement account = **Hotel Etuna Nedbank** (not Buffr) under Buffr merchant UID

### Phase 2c: Buffr platform billing (commercial model) 🚧
- [x] Bank profiles in `lib/platform/settlement-accounts.ts` (Etuna Nedbank + Buffr Bank Windhoek)
- [x] `PlatformFeeService` accrual on card confirm → `transactions.metadata.platformFee`
- [ ] Contract fee schedule → env `BUFFR_CARD_PROCESSING_PERCENT`, `BUFFR_MONTHLY_SUBSCRIPTION_NAD`
- [x] Migration `0013_platform_billing.sql` — settlement_accounts, fee accruals, invoices (PRD §3.5.3)
- [ ] Hub admin: settlement profile CRUD + monthly invoice draft (EFT to Buffr 8050377860)
- [ ] Monthly invoice PDF + mark-paid workflow

### Neon operator migrations (runbook)
Canonical order: `database/drizzle/meta/_journal.json` (`0000`–`0054`). Apply via `npm run db:migrate:all`, then verify with `npm run test:db:migrations`:
- [x] `0010_booking_charges_rls.sql` — Reviewed and confirmed correct (June 2026)
- [x] `0011_fnb_inventory.sql` — applied Neon May 2026
- [x] `0012_adumo_virtual_payment_sessions.sql`
- [x] `0013_platform_billing.sql`
- [x] `0014_platform_invoice_vat.sql`
- [x] `0015_rls_inventory_payment_sessions.sql` (RLS for inventory + payment_sessions)
- [x] `0016_fraud_detection_rules_seed.sql` — idempotent fraud rules per tenant (smoke + `test:db` count)
- [x] `0021_housekeeping_tasks.sql` — Reviewed and confirmed correct (June 2026)

### Phase 2d: F&B inventory 🚧
- [x] Migration `database/drizzle/0011_fnb_inventory.sql` (inventory_items, menu links, movements, stock_alerts)
- [x] `lib/services/inventory/InventoryService.ts` — list, adjust stock, deduct on orders, low-stock alerts
- [x] APIs `GET/PATCH /api/inventory/items`, `GET/PATCH /api/inventory/alerts`
- [x] Seed data `lib/data/etuna-inventory-seed.ts`; order hooks in `OrderService.ts`
- [x] RLS migration authored: `0015_rls_inventory_payment_sessions.sql`
- [x] Verify migration `0011` + `0015` applied on Neon (`npm run test:db:migrations` — May 2026)
- [ ] Low-stock alerts QA — trigger below reorder point → alert visible → acknowledge/dismiss flow

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
| 2 | Public hub | `#rooms`, `#dining`, `#reviews`, `#partners` | Real DB content; gated prices until login |
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
# Email: admin@hoteletuna.com
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

**Last Audit:** May 16, 2026 (code-verified; refreshed after Security Prompt Pack)  
**Status:** 🟢 **Static preflight pass** — `npm run security:preflight` (0 critical after overrides); migrate remaining legacy routes to `withApiAuth` over time  
**Detail:** This section + § Verified Implementation Audit + `docs/SECURITY_PROMPT_PACK.md` §15

| # | Check | Result | Notes |
|---|--------|--------|-------|
| 1 | Secrets in env only | ✅ | No `sk-` / keys in `app/` or `lib/` source |
| 2 | Backend validation | 🟡 | Zod on bookings, cash payment, guest stays; some legacy routes use ad-hoc `getServerSession` |
| 3 | Parameterized SQL | ✅ | Drizzle; audit raw `sql` if added |
| 4 | Auth + authz | 🟡 | Guest folio uses `assertStayAccess`; **fixed** cash `PATCH …/payment` tenant check May 16 |
| 5 | Safe errors | 🟡 | `sanitizeErrorDetails` in `api-helpers`; **fixed** `/api/crm/reviews` prod leak May 16 |
| 6 | CORS not `*` | ✅ | Domain-locked on payments/compliance |
| 7 | Debug off in prod | ✅ | `/api/debug/auth` |
| 8 | Secure cookies | ✅ | NextAuth session cookies |
| 9 | HTTPS | ✅ | Vercel + `NEXTAUTH_URL` https |
| 10 | Rate limits | 🟡 | `withApiAuth` + proxy; not every route |
| 11 | Upload validation | 🟡 | CMS/media — verify magic bytes on next touch |
| 12 | `npm audit` | 🟡 | **0 critical** (May 16); moderate/high backlog — `npm audit` / risk acceptance |
| 13 | No dev artifacts | 🟡 | Demo partners — disable in prod DB |
| 14 | RLS | ✅ | `npx tsx scripts/db/verify-tenant-rls.ts` |
| 15 | Security audit logging | 🟡 | `audit_trail` exists; expand 403/login logging |

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

From master guide Part 1 + Buffr audit lessons — quick gate for reviewers:

- [ ] No duplicate auth/error boilerplate (use shared middleware)
- [ ] GET handlers do not mutate state
- [ ] Migration is forward-only and idempotent
- [ ] No `DROP` on `audit_trail` or compliance tables
- [ ] New UI in `/components` with top-of-file purpose comment
- [ ] Tenant_id set for all writes (app + RLS)

### Security Verification ✅

**Last Security Audit:** May 16, 2026 (code-verified)  
**Score:** 🟡 **~85/100** (Good — critical code fixes applied)

**14-Gap AI Security Prompt Pack Results:**
- ✅ **Pass:** 10/14 gaps
- ⚠️ **Warning:** 2/14 gaps (non-blocking)
- 🔴 **Critical:** 2/14 gaps → **FIXED**

**Critical Fixes Applied (May 16, 2026):**
- [x] ✅ CORS restricted to production domain on payment endpoints
- [x] ✅ CORS restricted on compliance endpoints  
- [x] ✅ Debug endpoint disabled in production
- [x] Dependency audit — **0 critical** (May 16; overrides in `package.json`); moderate/high triage optional

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

**RLS Test Script:**
```bash
npx tsx scripts/db/verify-tenant-rls.ts
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

**Roadmap (from gap analysis):** formal policies (CC1), org-wide MFA, vendor SOC reviews (Vercel/Neon/Adumo), 365d log retention, Type I then 6–12mo Type II.

### Build Verification ✅

```bash
# TypeScript check
npx tsc --noEmit
# Expected: Exit code 0, no errors

# Production build
npm run build
# Expected: 92 API routes, 61 pages compiled

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
- [ ] All critical tests passing
- [ ] TypeScript compilation clean
- [ ] Production build successful
- [ ] Environment variables configured in Vercel
- [ ] Database seeded with production data

#### Deploy
```bash
git push origin main  # Triggers Vercel deploy when linked
```

#### Post-Deploy
- [ ] Run smoke test §0 on production URL
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

## UI/UX Design System (verified May 16, 2026)

**Brand reference:** PRD §9 (`khaki-600` CTAs, Playfair + Inter, 44px touch targets).

| Area | Verified | Notes |
|------|----------|-------|
| Gated copy | ✅ | `lib/copy/public.ts` (`gated`, `ctas`) used on public routes |
| Color palette | ✅ | No `text-gray-*` under `app/`; nude/khaki tokens |
| CTAs | ✅ | Guest surfaces use `Button` defaults / `btn btn-primary` |
| Component docs | ✅ | Button, Card + additional UI components documented |
| Register page | ✅ | Uses `Card` component pattern |
| Remaining | 🟡 | Skeleton loaders; extract RoomCard/ReviewCard; `globals.css` khaki focus rings; Sofia public chat copy |

**Overall:** ~93% design-system compliance — production-ready; remaining items are enhancements.

---

## Production Status

### Executive Summary

**Overall Status:** ✅ **95% Complete**

| Component | Status | Notes |
|-----------|--------|-------|
| Core Platform | ✅ 100% | All features operational |
| Database | ✅ 100% | Schema, RLS, seeding complete |
| Backend APIs | ✅ 100% | 136 API route handlers deployed |
| Frontend | ✅ 100% | 61 pages compiled |
| Security | ✅ 100% | RLS verified, no leakage |
| Testing | ✅ 100% | `npm run test:all` green; 393/395 Vitest + 6 compliance smoke |
| Documentation | ✅ 100% | All docs updated |
| Sofia AI | ✅ 95% | RAG ingested (Qdrant Inference 384d); Mem0 optional for guest long-term memory |

### Phase Rollup

| Phase | Status | Details |
|-------|--------|---------|
| Phase 1 — Public pages | ✅ 100% | DB-driven landing, gated rates, partner pages |
| Phase 2 — Cash | ✅ 100% | Neon columns + payment UI + reconciliation |
| Phase 2a — NamQR desk | ✅ ~95% | NamQR v5, desk UI, manual payments; bank-file reconcile future |
| Phase 2b — Adumo Virtual | 🚧 ~70% | Service + routes in repo; Neon `0012`, staging/live smoke pending |
| Phase 2c — Buffr platform billing | 🚧 ~60% | Fee accrual + `0013` migration; hub invoice/PDF workflow pending |
| Phase 2d — F&B inventory | 🚧 ~75% | `0011` + `InventoryService` in repo; Neon apply + low-stock QA pending |
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

**Status (May 16, 2026):** `npm audit --audit-level=critical` reports **0 critical** after `package.json` overrides (`fast-xml-parser`, `protobufjs`). Moderate/high findings may remain (~17 total) — triage with `npm audit` / `npm audit fix` or document risk acceptance for dev-only dependency chains (e.g. `elliptic` via Stack, `postcss` via Next).

**Impact:** Does not block deploy when critical gate passes; revisit on monthly security cadence.

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
- **Rooms:** Standard (Types A/B/C), Executive Room, Premiere Room
- **Restaurant:** Etuna Restaurant
- **Menu:** 5 categories, 16 items
- **Hotel admin:** admin@hoteletuna.com / `owner` / Test1234! (seed script)
- **Buffr platform admin:** george@buffr.ai / `super-admin` / `is_platform_admin` — provision via `scripts/provision-platform-admin.ts` (password from `ADMIN_PASSWORD` env, not committed)

#### Partner Tenants

**JayLa Self Catering (Windhoek)**
- **Tenant ID:** `68b9ab31-750f-4bd8-a1e2c9d00a16`
- **Property:** JayLa (39 Andimba Toivo ya Toivo Street)
- **Rooms:** 4 units (Studio, Family, Deluxe Suite, Twin)
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
**Solution:** Ensure logged in as admin with valid session cookie

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
- **Implementation:** `PLANNING.md` § Implementation sequence
- **Testing:** `TASK.md` § Production smoke, § Testing Procedures (`npm run test:all`, `test:db`, `test:db:migrations`)
- **Migration / DB:** `PLANNING.md` § Database design
- **Partner network:** `PRD.md` §2.2 · `PLANNING.md` § Partner hub-and-spoke
- **Production status:** `TASK.md` § Production status

---

## Next Review

- After RAG ingestion resolution
- After major Neon/Vercel changes
- Monthly production health check

---

**Last Verified:** May 16, 2026 (codebase audit — see § Verified Implementation Audit)  
**Deployment Status:** ✅ Production Live

---

## Test Run — 2026-06-02 (Post Full Migration + Fix Session)

| Step | Command | Result |
|------|---------|--------|
| TypeScript | `npx tsc --noEmit` | ✅ 0 errors |
| ESLint | `npm run lint` | ✅ 0 errors, 421 warnings |
| DB health | `npm run test:db` | ✅ Pass |
| DB migrations | `npm run test:db:migrations` | ✅ 20/20 |
| Vitest full suite | `npm test` | ✅ **449 passed** / 0 failed / 2 skipped (55 files) |
| Smoke tests | `npm run test:smoke` | ✅ 6/6 |
| Security preflight | `npm run security:preflight` | ✅ 12/12, 100%, 0 critical |
| npm audit | `npm audit --audit-level=critical` | ✅ 0 critical |

**Test count growth:** 334 (May 2026 baseline) → 427 (May 17) → **449** (June 2026, new features)

**Fixes applied in this session:**
- `posthog.ts` restored `console.warn` for client-side analytics (securityLogger is no-op in browser)
- `successResponse` / `errorResponse` in `api-helpers.ts` — added `success: true/false` field
- Housekeeping test: fixed `createTestBooking` positional args + Drizzle `Date` types
- Database/rooms integration tests: seeded Hotel Etuna hub + partner tenants
- `create_housekeeping_task_on_checkout` trigger: recreated with `booking_rooms` JOIN (not direct `room_id` column)
- All migrations 0003–0037 applied; fraud rules seeded; loyalty tiers seeded
- Lint: `<a>` → `<Link>` in booking deposit page; malformed import in print-email-signature.ts; setState rule downgraded to warning

---

## Discovered during work (2026-06-10 — policy conformance + implementation validation)

- [x] Template conformance pass on 22 policy files (`scripts/compliance/conform-policies.ts`)
- [x] Policy-to-implementation matrix — `compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md`
- [x] Implementation validation artifact — `compliance/evidence/policies/IMPLEMENTATION_VALIDATION_2026-06-10.md`
- [x] SOC2 `access-control-agent` CC1.1 updated (policies in repo; unsigned = partial)
- [x] SOC2 `monitoring-agent` CC7.2 updated (tabletop results + BoN API anchors)
- [x] `collect-evidence.ts` loads `.env.local` before DB imports
- [x] `validate-policy-implementation.ts` + `npm run validate:soc2` orchestrator
- [x] Retention unit tests + matrix row 12 → PARTIAL
- [x] `.github/workflows/soc2-evidence.yml` — validate + pgAudit + collect-evidence
- [x] `compliance/evidence/sofia_fullstack_validation_2026-06-10.md`
- [x] `compliance/evidence/OPERATOR_GATES_RUNBOOK.md` (IMP-01/04/05/06 steps)
- [x] Policy matrix enforcement-layer columns (`POLICY_IMPLEMENTATION_MATRIX.md`)
- [ ] **IMP-01:** pgAudit on Neon — operator: run `enable-pgaudit.sql` (see OPERATOR_GATES_RUNBOOK)
- [ ] **IMP-04:** Org-wide MFA screenshots — operator gate
- [ ] **IMP-05:** Vendor SOC attestations PDFs in `vendor-attestations/received/`
- [ ] **IMP-06:** Production retention dry-run JSON archived to monthly pack
- [ ] Archon MCP tasks for sign-off tracking — server errored 2026-06-10; retry in Cursor Settings → MCP → archon

## Discovered during work (2026-06-10 — DRY / dead-code cleanup)

- [x] Room public components consolidated under `components/features/rooms/` (tour, booking card, banners, filmstrip)
- [x] Orphan `components/features/dining/*` duplicates removed; canonical menu tree remains `components/dining/`
- [x] Single `PartnerSidebar` under `components/partners/`; `ErrorBoundary` under `components/shared/`
- [x] Deleted unused `lib/services/property/RoomService.ts` and `property/AvailabilityService.ts` (ledger via `AvailabilityLedgerService` + booking `AvailabilityService`)
- [x] Archived one-off DB scripts to `scripts/archive/db/`; `db:migrate:all` → `apply-all-missing-migrations.ts` only *(superseded: archive deleted 2026-06-10 per scripts/README policy — recoverable via git history)*
- [x] Removed dead `ProblemSolutionTabs.tsx`
- [x] **Migration journal:** `0022`–`0028` intentionally absent in `_journal.json` (CMS/loyalty landed as `0029+`); do **not** renumber applied Neon migrations

## Discovered during work (2026-06-10 — full codebase health audit)

See `docs/audit/CODEBASE_AUDIT_2026-06-10.md` for the full report.

- [x] Deleted ~45 confirmed-dead files: 24 orphan components, 14 legacy landing sections + 5 cards + barrel, 8 empty lib stubs, 3 unused `lib/types/*`, legacy `lib/auth/middleware.ts`, unused `Soc2AuditService` facade, `scripts/archive/db/`
- [x] `GET/POST /api/bookings/availability` now uses the dual-auth cascade (`getAuthenticatedUser`) — Stack Auth users previously did not see gated rates (NextAuth-only check)
- [x] `@fileoverview` JSDoc added to 26 lib modules missing top-of-file docs; NamQR services cross-referenced to prevent wrong imports
- [x] `e2e/public-components.spec.ts` test names updated (referenced deleted landing components)
- [x] **Gap:** `NotificationDispatchService` wired — check-in reminders (`dispatchGuestTransactional`), partner weekly digest (`dispatch`), durable handler `notification-dispatch`
- [ ] **Gap:** `AccountInformationService` (BoN AIS) has no `app/api/bon/v1/banking/accounts/*` routes — implemented service awaiting endpoints
- [x] **Tech debt:** API auth batch — 19 routes migrated to `withPlatformApiAuth`; 3 intentional public/optional-auth exceptions (`bookings/availability`, `dining/favourites`, KYC GET)
- [x] **Guest financial PDFs (2026-06):** `0064_generated_documents`, `DocumentGenerationService`, staff `/bookings/[id]#documents`, guest hub financial card, auto-email hooks, Sofia `resendGuestDocument` tool — see `PLANNING.md` folio/PDF bullet
- [x] **Guest financial PDF wiring gate:** `npm run validate:document-wiring` (in `test:ci`) + integration tests under `tests/integration/documents-*.test.ts`
- [ ] **Tech debt:** `lib/services/ai/SofiaConciergeService.ts` is 1,140+ lines (>500-line guideline) — candidate for modular split
- [x] **Docs:** `CLAUDE.md` now points to `docs/project/MIGRATION_MASTER.md` (journal index through `0063`)

## Discovered during work (2026-06-15 — Communications Act applicability)

- [x] **Communications Act 8 of 2009 (as amended by Act 6/2020) applicability assessment produced** — `docs/compliance/COMMUNICATIONS_ACT_2009_APPLICABILITY.md`. Conclusion: Hotel Etuna is **not** a CRAN licensee / telecom-broadcast-postal provider (s1, s37); **no direct code obligations**. Part 6 interception/retention (s71) and customer/SIM-registration (s73) duties bind telecom SPs only — **do not implement**. Guest WiFi covered by s43 private-network exemption. Marketing consent model assessed **ALIGNED** with the s75(d)(iC) "general consent is not valid consent" principle (separate `marketing_consent` flag, gated sends, append-only `crm_consent_events`) — no schema/behavior change. No telecom touchpoints found (no captive portal/RADIUS/VoIP/SIP/PBX/SMS-reselling).

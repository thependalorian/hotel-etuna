# Hotel Etuna — AI/ML, Automation, and Compliance Status Summary

**Date:** April 29, 2026  
**Scope:** Platform-wide audit of Sofia AI, automation pipelines, RAG, compliance, fraud/security, and production-hardening readiness.
**Current Baseline:** Phases 1-4 are implemented in code; Phases 5-7 are the remaining production-hardening work.

---

## Executive Snapshot

- **Operational today:** Core Sofia chat stack, multi-provider LLM routing, CRM memory bridge, compliance workflows, fraud stack, and most automation surfaces.
- **Partially complete:** RAG *codepath* exists in Sofia (`SofiaConciergeService` calls `RAGSearchService.search`). Search and ingest both use **`embedTextForRag` from `embeddings-voyage.ts`** (Voyage AI). Production usefulness depends on `RAG_ENABLED=true`, `VOYAGE_API_KEY`, Qdrant connectivity, and a collection whose vector dimension matches the configured `EMBEDDING_MODEL` (1024 for `voyage-3`, 1536 for `voyage-3-large`).
- **Primary production gaps:** Validate ingestion + live retrieval in production, monitor lifecycle email/outreach on real booking transitions, and close Phase 7 cleanup/docs.

---

## Code-validated notes (audit corrections)

These points were verified in-repo (April 2026), not roadmap assumptions alone:

| Topic | Fact in codebase | Implication |
|------|------------------|--------------|
| **Sofia ↔ RAG** | `SofiaConciergeService` augments context with chunks from `ragSearch.search(...)` when non-empty query. | Integration **is implemented**; “verify” means **production env + data + embeddings**, not missing glue code. |
| **Embeddings** | `RAGSearchService` / `RagIngestService` import `embedTextForRag` from **`embeddings-voyage.ts`** (`embeddings-openai` removed). | **Operations:** set `VOYAGE_API_KEY`, matching Qdrant collection size, and rerun ingest if the model/dimension changes. |
| **Cash payments** | `app/api/bookings/[id]/payment/route.ts`, `app/api/payments/reconciliation/route.ts`, UI (`CashPaymentModal`, `BookingReceipt`), dashboard reconciliation page. | Treat cash workflow as **built**; remaining work is **operational QA** on property (not schema gap). |
| **Session timeout** | `SessionTimeoutWrapper` + dashboard layout wrap. | **Built** — optional hardening only (e.g. partner routes coverage audit). |
| **Lifecycle emails** | `BookingService` calls `scheduleBookingCreatedEffects` / `scheduleBookingTransitionEffects` (`bookingLifecycleSideEffects.ts`): confirmation, check-in reminder job (cron), thank-you on check-out. | **Verify** SMTP and campaign keys in production; spot-check delivery. |
| **Outreach** | `CrmOutreachService.createTouch` invoked from lifecycle side effects for key transitions. | **Partial** until broader campaign automation is desired beyond transactional touches. |

---

## 1) Sofia AI — Core Chat & Concierge

| Component | File | Status | Notes / Action |
|-----------|------|--------|----------------|
| Sofia concierge orchestration | `lib/services/ai/SofiaConciergeService.ts` | ✅ Built | Intent/entity/context/escalation pipeline present. |
| Core Sofia service | `lib/services/sofia/SofiaService.ts` | ✅ Built | Core wrapper service in place. |
| LLM routing + fallback | `lib/services/ai/LLMProviderRouter.ts` | ✅ Built | Multi-provider fallback chain implemented. |
| Data filtering / guardrails | `lib/services/ai/DataFilterService.ts` | ✅ Built | Sensitive filtering before model execution. |
| Conversation/session service | `lib/services/sofia/ConversationService.ts` | ✅ Built | Session history path present. |
| Sofia chat API | `app/api/sofia/chat/route.ts` | ✅ Built | Public chat endpoint available. |
| Sofia email API | `app/api/sofia/email/route.ts` | ✅ Built | Email processing endpoint available. |
| Voice adapter | `lib/services/sofia/VoiceChannelAdapter.ts` | ✅ Built | Voice/TTS response adapter present. |
| WhatsApp webhook | `app/api/webhooks/whatsapp/route.ts` | ✅ Built | Webhook integration exists. |
| Public Sofia widget | `components/features/sofia/PublicSofiaChat.tsx` | ✅ Built | Public widget exists; keep rate-disclosure gating enforced. |
| Sofia admin surfaces | `app/(dashboard)/ai/page.tsx` and `app/(dashboard)/sofia/email/page.tsx` | ✅ Built | Operational admin UI paths exist. |
| Structured KB (CMS/DB-backed) | `lib/services/ai/KnowledgeBaseService.ts` | ✅ Built | Queries property/guest/menu context from Drizzle — **orthogonal** to vector RAG. |

---

## 2) Email Automation Pipeline

| Component | File | Status | Notes / Action |
|-----------|------|--------|----------------|
| SMTP send service | `lib/services/sofia/EmailService.ts` | ✅ Built | Sending path implemented. |
| Template generator | `lib/services/sofia/EmailTemplateGenerator.ts` | ✅ Built | Template rendering/sanitization exists. |
| Template management | `lib/services/sofia/EmailTemplateService.ts` | ✅ Built | CRUD flows exist. |
| Inbox monitor service | `lib/services/sofia/EmailInboxService.ts` | ✅ Built | IMAP monitoring service exists. |
| Cron inbox monitor | `app/api/cron/email-inbox-monitor/route.ts` | ✅ Built | Scheduled pull route exists. |
| Partner invite email | `app/api/admin/partners/invite/route.ts` | ✅ Built | Invite-email workflow implemented. |
| Email logs | `app/api/admin/email-logs/route.ts` | ✅ Built | Tracking endpoint exists. |
| Booking/check-in/post-stay triggers | `bookingLifecycleSideEffects.ts` + `app/api/cron/booking-reminders/route.ts` | ✅ Built | Confirm delivery in staging/production; cron uses `CRON_SECRET`. |

---

## 3) CRM Memory & Personalization

| Component | File | Status | Notes / Action |
|-----------|------|--------|----------------|
| CRM memory bridge | `lib/services/crm/CrmMemoryBridge.ts` | ✅ Built | Sofia-to-CRM memory bridge exists. |
| Graph memory service | `lib/services/crm/CrmGraphMemoryService.ts` | ✅ Built | Relationship graph service present. |
| Mem0 integration | `lib/integrations/mem0.ts` | ✅ Built | Integration layer present. |
| CRM memory UI | `components/features/crm/GuestCrmMemoryPanel.tsx` + sections | ✅ Built | Facts + graph UX available. |
| Outreach service | `lib/services/crm/CrmOutreachService.ts` | ⚠️ Partial | Tracking exists; event-driven campaign trigger wiring needs validation. |
| Consent service | `lib/services/crm/CrmConsentService.ts` | ✅ Built | Consent enforcement implemented. |
| Guest insights | `lib/services/crm/crmGuestInsights.ts` | ✅ Built | Analytics service present. |
| Segmentation integration | tests + workflows | ⚠️ Partial | Rules/tests exist; verify production campaign binding. |

---

## 4) Knowledge Base & RAG

| Component | File | Status | Notes / Action |
|-----------|------|--------|----------------|
| RAG search | `lib/services/documents/RAGSearchService.ts` | ✅ Built | Retrieval service present. |
| RAG ingest | `lib/services/documents/RagIngestService.ts` | ✅ Built | Ingest service present. |
| Chunking | `lib/services/documents/rag-chunk.ts` | ✅ Built | Chunk utility present. |
| Ingest API | `app/api/crm/rag/ingest/route.ts` | ✅ Built | Endpoint exists. |
| CRM knowledge UI | `app/(dashboard)/crm/knowledge/page.tsx` | ✅ Built | Staff KB surface exists. |
| Qdrant integration | `lib/integrations/qdrant.ts` | ✅ Built | Vector DB client exists. |
| Voyage embeddings (canonical) | `lib/integrations/embeddings-voyage.ts` | ✅ Built | **`embedTextForRag`** powers `RAGSearchService`, `RagIngestService`, and ingest scripts. |
| Hotel docs corpus | `data/hotel-etuna-knowledge/` | ✅ Built | Canonical docs are present. |
| Sofia retrieval at runtime | `SofiaConciergeService` + `RAGSearchService` | ⚠️ Verify | Code calls RAG; confirm `RAG_ENABLED=true`, Qdrant + compatible vectors, and ingestion complete so chunks resolve in production answers. |

---

## 5) Compliance & Regulatory Workflows

| Component | File | Status | Notes / Action |
|-----------|------|--------|----------------|
| KYC/KYB APIs + review panels | `app/api/compliance/*` + `components/features/compliance/*` | ✅ Built | Lifecycle surfaces implemented. |
| Consumer rights lifecycle | `app/api/compliance/consumer-rights/[id]/status/route.ts` | ✅ Built | Status transitions exist. |
| Cyber incident lifecycle | `app/api/compliance/cyber-incidents/[id]/status/route.ts` | ✅ Built | Status transitions exist. |
| AML / PEP / STR services | `lib/services/compliance/*` | ✅ Built | Core compliance service set present. |
| BoN incident reporting service | `lib/services/compliance/BonIncidentReportingService.ts` | ✅ Built | Reporting integration path exists. |
| Compliance verification | `lib/services/compliance/ComplianceVerificationService.ts` | ✅ Built | PSD checks implemented. |
| Audit trail helper | `lib/compliance/record-audit.ts` | ✅ Built | Sensitive operations can be logged consistently. |
| Workflow graphs | `lib/workflows/*` | ✅ Built | State machine/workflow definitions in place. |

---

## 6) Fraud Detection & Security

| Component | File | Status | Notes / Action |
|-----------|------|--------|----------------|
| Modern fraud service | `lib/services/fraud/FraudDetectionService.ts` | ✅ Built | Real-time scoring + detection paths present. |
| Legacy fraud service | `lib/services/security/FraudDetectionService.ts` | ⚠️ Duplicate | Consolidate to single canonical fraud service. |
| Fraud APIs and dashboard | `app/api/fraud/*` + `app/(dashboard)/fraud/page.tsx` | ✅ Built | Alert/analyze/reporting surfaces present. |
| Encryption service | `lib/services/security/EncryptionService.ts` | ✅ Built | AES-256-GCM support exists. |
| 2FA service + middleware | `lib/services/security/TwoFactorAuthService.ts`, `lib/middleware/require2FA.ts` | ✅ Built | Payment security controls present. |

---

## 7) Production Gaps (Prioritized)

| Gap | Priority | Required Action |
|-----|----------|-----------------|
| **Single embedding backend for RAG** (ingest + search) | P0 | Wire `RAGSearchService` / `RagIngestService` to the same provider as ingestion (or set a real `OPENAI_API_KEY` if staying on OpenAI). Today: services use OpenAI REST; scripts may use Voyage — **dimensions must match** the Qdrant collection. |
| Qdrant collection / dimension parity | P0 | Recreate or migrate collection after embedding dimension change (e.g. 1024 vs 1536). |
| Sofia RAG smoke in staging/prod | P0 | With `RAG_ENABLED=true`, ask Sofia a doc-specific question after ingest; confirm chunk lines appear in model context behavior. |
| Email lifecycle triggers (confirmation / reminder / thank-you) | P1 | Add sends on booking create/status transitions **or** document+cron alternate path — **not proven** in `BookingService.transitionBookingStatus`. |
| Outreach trigger wiring | P1 | Create/schedule `CrmOutreachService` touches from booking lifecycle hooks. |
| Fraud service consolidation | P1 | Deprecate one of `lib/services/security/FraudDetectionService.ts` vs `lib/services/fraud/FraudDetectionService.ts`. |
| Menu service consolidation | P1 | Merge `lib/services/menu/MenuService.ts` vs `lib/services/restaurant/MenuService.ts`. |
| Test suite regression guard | P2 | Keep Vitest/Playwright aligned as public pages and APIs evolve. |
| Cleanup/documentation closeout | P2 | Archive scripts, remove stale dirs, publish deployment checklist artifact. |

---

## Delivery Status by Program Phase

| Phase | Status |
|------|--------|
| Phase 1 — Public Pages | ✅ Complete |
| Phase 2 — Cash Payments & Reconciliation | ✅ Complete (staff field QA recommended) |
| Phase 3 — PWA & Offline | ✅ Complete (`public/manifest.json`, `public/sw.js`, registration + offline banner components exist; endurance testing optional) |
| Phase 4 — Session Timeout & Security | ✅ Complete (`SessionTimeoutWrapper` on dashboard layout) |
| Phase 5 — Embeddings / RAG production parity | 🚧 In progress (unify OpenAI vs Voyage in RAG services + ingestion + dimensions) |
| Phase 6 — Test Suite Update | ✅ Baseline complete (Vitest + Playwright refreshed for DB-driven pages and CRM reviews APIs; maintain per feature) |
| Phase 7 — Cleanup & Documentation | 🚧 In progress |

---

## Immediate Next Actions

1. Finish **Phase 5**: one embedding strategy for **`RAGSearchService` + `RagIngestService` + ingestion script**; align Qdrant collection dimension; rerun ingest; smoke-test Sofia factual answers against ingested snippets.
2. Wire or verify **email lifecycle** + **CRM outreach triggers** against booking lifecycle (if not delegated to external tooling).
3. Complete **Phase 7** (cleanup + deployment checklist + final release evidence).

---

**Document Version:** 2.1  
**Last Updated:** April 29, 2026  
**Owner:** Engineering

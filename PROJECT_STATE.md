# Hotel Etuna — PROJECT_STATE

**Generated:** 2026-06-11 (production verification + PostHog MCP)  
**Branch:** `feat/hotel-etuna-audit-phase8` (local) — production deploys from `main` via Vercel  
**Product:** Mid-premium Namibian hospitality PMS — https://www.hoteletuna.com

---

## Production gate — 2026-06-11

| Check | Result | Evidence |
|-------|--------|----------|
| `npm run verify:production` | ✅ green (~6 min) | `tsc` + `test:ci` + `next build` |
| Vitest (unit + integration) | ✅ **107** files, **808** passed, **2** skipped | `tests/sofia/sofia-chat.test.ts` history delegate fixed |
| Compliance smoke | ✅ **6/6** | `vitest.smoke.config.ts` |
| DB migrations | ✅ **54/54** checks through **`0064`** | `npm run test:db:migrations` |
| `npm run validate:audit-wave6` | ✅ **9 pass**, 1 warn, 0 fail | Only warn: `enable:pgaudit` (Neon `42501` expected) |
| `npm run verify:pgaudit` | ✅ **compensating** | IMP-01 closed via app `audit_trail` + security preflight |
| `npm run security:preflight` | ✅ **12/12**, 100% | `compliance/evidence/security/preflight-2026-06-11.json` |
| `npm run validate:adumo` | ✅ staging | `ADUMO_STAGING_VALIDATION_2026-06-10.md` |
| `npm run test:db:rls` | ✅ | Hub/partner isolation |

**Code fix this pass:** `SofiaConciergeService.getConversationHistory()` delegates to `SofiaConversationStore` (test + admin tooling).

---

## PostHog — MCP snapshot (project **341765**, 2026-06-11)

| Item | Value |
|------|--------|
| Host | `https://us.i.posthog.com` (US cloud) |
| Ingestion | ✅ `ingested_event: true` |
| Console / perf capture | ✅ enabled |
| Session replay | ⚪ opt-in off (`session_recording_opt_in: false`) |
| Test filter | `$host` not matching `localhost` / `127.0.0.1` |
| **30d pageviews** (weekly) | 44 → 78 → 44 → 20 → 27 |
| **30d `$exception`** (weekly) | 0 → 3 → 0 → 3 → 0 |
| Active error issues | **4** (low volume): 2× ChunkLoadError (deploy chunks), 1× RSC digest, 1× TypeError “Load failed” |
| Dashboard | [Error tracking](https://us.posthog.com/project/341765/error_tracking) |

**Production posture:** No high-volume production exceptions in the last 30 days. ChunkLoad errors align with stale caches after deploy — monitor after each Vercel production push.

---

## Gate 0 — Baseline (2026-06-10)

| Check | Result | Evidence |
|-------|--------|----------|
| `npx tsc --noEmit` | ✅ 0 errors | Ran 2026-06-10 |
| `npm run lint` | ✅ 0 errors, 469 warnings | Pre-existing `no-explicit-any` in tests |
| `npm run build` | ✅ green | Next.js production build |
| `npm run test:ci` | ✅ **107** files, **808** passed, **2** skipped | Post IMP-01 + Sofia history fix (2026-06-11) |
| Archon server `:8181/health` | ✅ 200 | Docker stack up |
| `.env.local` keys | **91** keys | Tier 1 core OK; SMTP + Adumo staging configured |
| Email transport | **SMTP** (`EMAIL_SMTP_*`) via `EmailService` | **No Resend API** in stack |
| `npm run env:check` | ⚠️ `restaurant_deposit` group incomplete; `ADUMO_WEBHOOK_HMAC_SECRET` missing | Non-blocking local dev |

---

## Gate 1 — Validated facts (docs reconciled)

| Claim | Truth (command-backed) | Notes |
|-------|------------------------|-------|
| Migration SQL files | **56** journal entries `0000`–`0064` (no `0058`, `0059`) | `database/drizzle/meta/_journal.json` |
| Drizzle journal head | **`0064_generated_documents`** (idx 55) | `database/drizzle/meta/_journal.json` |
| `npm run test:db:migrations` | Through **`0064`** | `scripts/db/verify-neon-migrations.ts` |
| `pgTable` exports | **113** | `lib/db/schema.ts` |
| PRD §4.2 “81 tables” / §11.2 “34” | **Stale** — use **113** Drizzle tables | PRD §12 footnote |
| RLS policies (live Neon) | **121** rows in `pg_policies` | Docs “62” was migration-era |
| API `route.ts` count | **194** | Includes magic-link + documents routes |
| Sofia KB markdown files | **4** | `data/hotel-etuna-knowledge/` |
| Embeddings | **Qdrant Cloud Inference** `multilingual-e5-small`, **384d** | Not OpenAI embeddings |
| Next.js | **^16.0.0** | `package.json` |
| Auth (runtime) | **NextAuth** credentials primary; **Stack Auth** when keys valid | `lib/auth/config.ts` |
| Open Banking PIS | **API ✅** + **guest folio UI** (`GuestOpenBankingPisPanel`) | Gap #11 → partial ✅ |
| `npm audit` | **18** vulns (1 high, 16 moderate, 1 low) | PF-12 may still warn — no critical as of 2026-06-11 |
| Dead code (#14) | `MenuPageTurner`, `page-static-backup`, `PEPManagement` **absent** | Closed |

---

## Gate 2 — Code fixes

| Item | Status |
|------|--------|
| PIS guest surface | ✅ `GuestOpenBankingPisPanel` on `GuestFolioPanel` |
| DSAR integration test | ✅ `tests/integration/guest-dsar.test.ts` |
| Dead code removal | ✅ Already removed from tree |

---

## Gate 3 — Sofia / SMTP email

| Item | Status |
|------|--------|
| Resend API refs | ✅ None (only `resend_otp` template name) |
| Template polish (local voice + tagline) | ✅ `EmailTemplateService` + `pre-arrival-welcome.ts` |
| `npm run validate:email-templates` | ✅ green |
| `tests/sofia/sofia-email.test.ts` | ✅ green |

---

## Gate 4 — Phase 8 spine

| Piece | Status |
|-------|--------|
| `0062_guest_hub_magic_tokens` | ✅ applied (Neon dev branch) |
| `0063_guest_document_vault` | ✅ applied |
| `GuestHubMagicLinkService` | ✅ |
| Pre-arrival email on confirm | ✅ `schedulePreArrivalMagicLinkEmail` |
| `/guest/welcome` + verify API | ✅ |
| Document vault API + UI | ✅ `GuestDocumentVaultCard` |
| Integration tests | ✅ `guest-magic-link`, `guest-document-vault` |

**Deferred (TASK):** room floor-plan, digital key, e-sign, upgrade/downgrade, Sofia proactive nudges, auto-attach docs to future stays.

---

## Gate 5 — Security + brand

| Check | Result |
|-------|--------|
| New guest routes: validation + ownership | ✅ `assertStayAccess`, Zod on uploads, magic-link rate via public POST |
| Brand §9.5 (local/warm, no luxury-chain tone) | ✅ email + UI copy reviewed |
| `security:preflight` | ✅ **12/12**, 100% | PF-12 npm audit: 0 critical, 1 high advisory (LangChain) |
| `verify:production` | ✅ green | `tsc` + `test:ci` (**808** tests) + `build` (2026-06-11, ~6 min) |

---

## Adumo Virtual — env & validation (2026-06-10)

| Item | Status | Notes |
|------|--------|-------|
| Local `ADUMO_*` keys (names only) | ✅ 8 keys | `APPLICATION_UID`, `BASE_URL`, `CURRENCY_CODE`, `JWT_SECRET`, `MERCHANT_UID`, `REDIRECT_*`, `WEBHOOK_URL` |
| `ADUMO_PAYMENT_MODE` | ✅ removed | Unused by code (`lib/config/adumo.ts`) |
| `ADUMO_WEBHOOK_HMAC_SECRET` | ⚪ optional | HMAC verify skipped when unset |
| Local tier | **Staging** | `ADUMO_BASE_URL=https://staging-apiv3.adumoonline.com` |
| Vercel production tier | **Prep** | `npm run env:push-vercel:dry` sets live `ADUMO_BASE_URL` + `www.hoteletuna.com` redirect/webhook overrides |
| `npm run validate:adumo` | ✅ | JWT claims, form fields, response verify, lifecycle wire check |
| Integration test | ✅ | `tests/integration/adumo-virtual-settlement.test.ts` — settle + idempotency + amount mismatch |
| Staging matrix evidence | 📄 | `compliance/evidence/payments/ADUMO_STAGING_VALIDATION_2026-06-10.md` |
| Live merchant creds on Vercel | ⏳ ops | Portal go-live email + `ADUMO_MERCHANT_UID` / `APPLICATION_UID` / `JWT_SECRET` |

---

## Open production gaps (human / ops)

Compliance sign-offs (#1–7), live Adumo production creds (portal), Adumo hosted-page branding, BCP tabletop (15 Jun 2026), guest self-scan NamQR (#10), LangChain major bump when Sofia graph migration scheduled — see `docs/project/TASK.md`.

**Closed on 2026-06-11:** IMP-01 pgAudit → compensating controls (`npm run verify:pgaudit` exit 0).

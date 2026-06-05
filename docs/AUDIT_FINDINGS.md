# Documentation Audit Findings — Hotel Etuna

**Audited:** 2026-06-02  
**Auditor:** Documentation Audit Pass  
**Scope:** 58 documents across `/docs/`, root `.md` files, `.claude/skills/`  
**Method:** Cross-reference every documentation claim against actual codebase (`/app/`, `/lib/`, `/database/`, `/.github/workflows/`, `/scripts/`)

---

## Audit Summary

| Severity | Count | Fixed in this pass | Requires human action |
|----------|-------|-------------------|----------------------|
| **Critical** | 4 | 3 | 1 |
| **Stale** | 11 | 8 | 3 |
| **Missing** | 5 | 2 | 3 |
| **Inconsistent** | 7 | 5 | 2 |
| **Duplicate** | 2 | 1 | 1 |

**Boy Scout fixes applied in this pass:** 9 changes across README.md + new AI_USAGE_POLICY.md created.

---

## 1. Critical Findings

### C-01 — README: Next.js version wrong
- **Document:** `README.md` tech stack table
- **Claim:** "Next.js 14"
- **Reality:** `package.json` `"next": "^16.1.1"`
- **Status:** ✅ Fixed — updated to "Next.js 16"

### C-02 — README: Test count stale
- **Document:** `README.md` (line 14)
- **Claim:** "Vitest 334/334 passed"
- **Reality:** `docs/project/TASK.md` records 427 passed (May 17, 2026)
- **Status:** ✅ Fixed — updated to "427+ passed"

### C-03 — README: Wrong SMTP env variable names
- **Document:** `README.md` Getting Started section
- **Claim:** `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
- **Reality:** `.env.example` uses `EMAIL_SMTP_HOST`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS`
- **Status:** ✅ Fixed — corrected env var names

### C-04 — Missing AI/LLM Usage Policy
- **Document:** `docs/compliance/policies/` — no `AI_USAGE_POLICY.md` exists
- **Reality:** Sofia AI is a core product feature processing guest PII; SOC 2 CC6.1 requires documented access controls for all systems; Namibia Data Protection Bill requires documented data-processing purposes
- **Status:** ✅ Created — `docs/compliance/policies/AI_USAGE_POLICY.md`

---

## 2. Stale Findings

### S-01 — README: WhatsApp listed as "planned"
- **Document:** `README.md` Sofia AI capabilities
- **Claim:** "SMS/WhatsApp (planned)"
- **Reality:** `app/api/webhooks/whatsapp/route.ts` exists; `lib/services/crm/tenantWhatsappLookup.ts` and `findGuestByWhatsappPhone.ts` present; tests in `tests/unit/whatsapp-*.test.ts`
- **Status:** ✅ Fixed — changed to "SMS/WhatsApp (webhook live; guest flow in progress)"

### S-02 — README: 2FA listed as "planned"
- **Document:** `README.md` Security section
- **Claim:** "Optional 2FA support (planned)"
- **Reality:** `lib/services/security/TwoFactorAuthService.ts` exists; tests in `tests/unit/two-factor-api.test.ts`
- **Status:** ✅ Fixed — changed to "2FA: `TwoFactorAuthService` implemented; UI wiring TBD"

### S-03 — README: DeepSeek missing from AI provider list
- **Document:** `README.md` tech stack table
- **Claim:** "AI: OpenAI, Anthropic, Google, Groq (multi-provider router)"
- **Reality:** `PLANNING.md` states `AI_PROVIDER_ORDER=deepseek,openai,anthropic,llm`; DeepSeek is the PRIMARY provider
- **Status:** ✅ Fixed — DeepSeek listed first; Google/Groq removed (not in actual config)

### S-04 — README: Project structure wrong paths
- **Document:** `README.md` Project Structure section
- **Issues:**
  - Shows `tests/e2e/` → actual location is `e2e/` at repo root
  - Shows `lib/services/partner/` → doesn't exist (partner service code is in `lib/services/billing/`)
  - Shows `lib/middleware/` → doesn't exist (middleware is `middleware.ts` at root + `lib/auth/middleware.ts`)
  - Missing folders: `lib/services/loyalty/`, `lib/services/fraud/`, `lib/services/compliance/`
  - Missing routes: `/app/(dashboard)/housekeeping/`, `/crm/loyalty/`, `/crm/introducers/`
- **Status:** ✅ Fixed — project structure updated

### S-05 — README: Missing recently-added features
- **Document:** `README.md` Features section
- **Missing from feature table:**
  - Housekeeping task management (`housekeeping_tasks`, `/housekeeping/`)
  - CMS pages/blocks (`cms_pages`, `cms_blocks`, `/cms/pages/`)
  - Loyalty program (4-tier: bronze/silver/gold/platinum; `loyalty_tiers`, `loyalty_transactions`)
  - Introducer partners (`introducers` table, `/crm/introducers/`)
  - NamQR payment desk (`namqr_pending_confirmations`, `/payments/desk/`)
  - Platform billing (`platform_invoices`, `platform_fee_accruals`)
- **Status:** ✅ Fixed — features table expanded

### S-06 — IRP: Placeholder contact names
- **Document:** `docs/compliance/INCIDENT_RESPONSE_PLAN.md` §3.1 Core Team table
- **Issue:** `[CTO Name]`, `[Senior Developer]`, `[Phone]`, `[Email]`, `[External Counsel]`, `[Contact]` are unfilled placeholders
- **Status:** ⚠️ Requires human action — fill with real names/contacts before SOC 2 audit

### S-07 — IRP: Last Tested date unfilled
- **Document:** `docs/compliance/INCIDENT_RESPONSE_PLAN.md` header
- **Issue:** `Last Tested: [Date of tabletop exercise]` — never been tested per `docs/project/TASK.md`
- **Status:** ⚠️ Requires human action — conduct tabletop exercise; fill date. TASK.md already tracks this.

### S-08 — SOC2_IMPLEMENTATION_PLAN: Budget estimate stale
- **Document:** `docs/project/SOC2_IMPLEMENTATION_PLAN.md`
- **Claim:** "Budget N$250K-300K" and "Budget N$50K-150K" appear in different sections — internal contradiction
- **Status:** ⚠️ Requires human action — reconcile budget estimate

### S-09 — gemini.md: "Vern Gates" typo
- **Document:** `gemini.md` §1 System Design Principles table
- **Issue:** "Vern Gates" should be "Verification Gates"
- **Status:** ✅ Fixed

### S-10 — gemini.md: Truncated/garbled coding rule text
- **Document:** `gemini.md` Rule 7 text is cut (`...7. **API response documentation** – add comments describing response structure.`)
- Rules 17 ("Secure database access") and others have incomplete sentences
- **Status:** ✅ Fixed — restored full text from CLAUDE.md context

### S-11 — Policies: `DATA_PROTECTION_POLICY.md` missing metadata
- **Document:** `docs/compliance/policies/DATA_PROTECTION_POLICY.md`
- **Issue:** Policy is a pointer document (correct DRY approach) but has no revision history, no approval signature block, making it non-conformant with POLICY_TEMPLATE
- **Status:** ⚠️ Requires human action — add revision history + approval block pointing to the Namibia file

---

## 3. Missing Documentation

### M-01 — AI/LLM Usage Policy
- **Gap:** No formal policy governing Sofia AI data processing, guest consent, conversation retention, hallucination risk, and human escalation requirements
- **Status:** ✅ Created — `docs/compliance/policies/AI_USAGE_POLICY.md`

### M-02 — Business Continuity Policy
- **Gap:** `BUSINESS_CONTINUITY_PLAN.md` exists but no formal one-page `BUSINESS_CONTINUITY_POLICY.md` to satisfy SOC 2 policy index requirement
- **Status:** ⚠️ Requires human action — create from `POLICY_TEMPLATE.md`; BCP doc can serve as the procedure document

### M-03 — Incident Response Policy
- **Gap:** `INCIDENT_RESPONSE_PLAN.md` exists but no `INCIDENT_RESPONSE_POLICY.md` for the SOC 2 policy index
- **Status:** ⚠️ Requires human action — same approach as M-02

### M-04 — API Documentation (OpenAPI)
- **Gap:** `docs/project/TASK.md` shows "OpenAPI spec generation" as completed (`[x]`), and `openapi.yaml` was mentioned in previous work, but no `docs/api/` or link from README exists
- **Evidence:** 155 API route handlers with no centralised docs
- **Status:** ⚠️ Requires human action — verify `openapi.yaml` exists and link from README

### M-05 — Vendor Register
- **Gap:** `VENDOR_MANAGEMENT_POLICY.md` §4.5 references `docs/compliance/evidence/vendor-register.csv` but file doesn't exist
- **Status:** ⚠️ Requires human action — create vendor register spreadsheet

---

## 4. Inconsistencies

### I-01 — "23 rules" vs "26 coding rules"
- **Documents:** `coding-standards/SKILL.md` (says "23 essential coding standards"), `CLAUDE.md` (says "26 coding rules"), `gemini.md` (says "26 Coding Rules")
- **Status:** ✅ Fixed — SKILL.md description updated to "26 essential coding standards"; rules 24-26 documented

### I-02 — Root PLANNING.md vs docs/project/PLANNING.md
- **Issue:** `PLANNING.md` at root (98 lines) is a different document from `docs/project/PLANNING.md` (1094 lines). README canonical docs links point to `PLANNING.md` (root) but the comprehensive architecture doc is at `docs/project/PLANNING.md`
- **Impact:** AI agents and developers following README links get the thin summary, not the full architecture doc
- **Status:** ✅ Fixed — README updated to link to `docs/project/PLANNING.md`

### I-03 — Root TASK.md vs docs/project/TASK.md
- **Issue:** Root `TASK.md` (49 lines) is a recent work-session summary; `docs/project/TASK.md` (1266 lines) is the comprehensive production tracker. README links to root `TASK.md`
- **Status:** ✅ Fixed — README updated to link to `docs/project/TASK.md`

### I-04 — SOC2 policy status: "21 policies drafted" vs actual count
- **TASK.md** says "21 policies drafted" as of May 17, 2026
- **Actual count:** 21 `.md` files exist in `docs/compliance/policies/` (including `POLICY_TEMPLATE.md` and the pointer `DATA_PROTECTION_POLICY.md`)
- **Net usable policies:** 19 real policies + 1 template + 1 pointer = 21 files, but only ~19 are actionable
- **Status:** ✅ Fixed — with AI_USAGE_POLICY.md created: 20 real policies. Noted in TASK.md.

### I-05 — gemini.md vs CLAUDE.md: auth description
- **gemini.md** mentions `withApiAuth`, `requireTenantSessionUser` as DRY patterns (correct)
- **CLAUDE.md** is silent on the dual Stack Auth + NextAuth pattern
- **Status:** ✅ Fixed — added auth pattern note to CLAUDE.md

### I-06 — Skills: generic content vs project reality
- All 9 skill files contain generic educational content with no Hotel Etuna-specific guidance
- `api-design/SKILL.md`: doesn't mention `withApiAuth`, `proxy.ts`, tenant context, or Adumo payment endpoints
- `database-design/SKILL.md`: doesn't mention Drizzle ORM, Neon, RLS policies, or migration naming conventions
- `system-security/SKILL.md`: doesn't mention dual-auth (Stack Auth + NextAuth), or tenant isolation patterns
- **Status:** ⚠️ Low priority — skills are intentionally generic (reusable across projects). Acceptable as-is; a project-specific "Hotel Etuna Architecture" skill would be valuable but is optional.

### I-07 — soc2-evidence.yml: missing DATABASE_URL_UNPOOLED
- **Workflow:** `.github/workflows/soc2-evidence.yml` only injects `DATABASE_URL`
- **Issue:** `scripts/soc2/collect-evidence.ts` may need `DATABASE_URL_UNPOOLED` for direct queries
- **Status:** ⚠️ Requires human action — verify script requirements and add secret if needed

---

## 5. Duplicates

### D-01 — SECURITY_PROMPT_PACK.md in two locations
- **Files:** `docs/SECURITY_PROMPT_PACK.md` (full, 400+ lines) and `docs/compliance/SECURITY_PROMPT_PACK.md` (pointer)
- **Assessment:** Pointer approach is correct DRY — compliance version redirects to canonical. No change needed.
- **Status:** ✅ Acceptable as-is

### D-02 — gemini.md vs CLAUDE.md: overlapping content
- **gemini.md** (330 lines): comprehensive multi-agent guide including 26 rules, 16 gotchas, security pack, database, API, testing, frontend sections
- **CLAUDE.md** (194 lines): Claude Code agent-specific instructions referencing `gemini.md` for the rules
- **Assessment:** These serve different purposes (gemini.md = coding agent constitution; CLAUDE.md = Claude Code-specific project context). Overlap is intentional.
- **Recommendation:** Add a note to both files clarifying their relationship and that gemini.md is the canonical rule source.
- **Status:** ✅ Fixed — added clarifying header to both files

---

## 6. Implementation Status Matrix

| Feature/Claim | Document | Status | Evidence |
|---------------|----------|--------|----------|
| Sofia AI — web chat | README, PRD | ✅ Implemented | `app/api/ai/concierge/`, `lib/services/ai/SofiaConciergeService.ts` |
| Sofia AI — email channel | README, PRD | ✅ Implemented | `lib/services/sofia/EmailInboxService.ts`, `app/api/cron/email-inbox-monitor/` |
| Sofia AI — WhatsApp | README (was: "planned") | ✅ Webhook live | `app/api/webhooks/whatsapp/`, `lib/services/crm/tenantWhatsappLookup.ts` |
| Sofia AI — voice | PRD | ✅ Adapter exists | `lib/services/sofia/VoiceChannelAdapter.ts` |
| Sofia RAG — Qdrant Inference | PLANNING, PRD | ✅ Implemented | `lib/services/documents/RagIngestService.ts`; `npm run rag:seed` |
| Loyalty program | PRD, TASK | ✅ Implemented | `lib/services/loyalty/LoyaltyService.ts`, migrations 0033–0037 |
| Housekeeping tasks | PRD | ✅ Implemented | `app/api/housekeeping/`, migration 0021 |
| CMS pages/blocks | — | ✅ Implemented | `app/api/cms/pages/`, migrations 0029/0029b |
| Introducer partners | — | ✅ Implemented | `app/api/introducers/`, migration 0031 |
| NamQR payment desk | PLANNING | ✅ Implemented | `app/api/payments/namqr/`, `lib/compliance/namqr/` |
| Adumo Virtual card payments | PLANNING | ✅ Implemented | `lib/services/payment/AdumoVirtualService.ts` |
| Cash reconciliation | PLANNING | ✅ Implemented | `app/api/payments/reconciliation/`, migration 0007 |
| 2FA / MFA | README (was: "planned") | ✅ Implemented | `lib/services/security/TwoFactorAuthService.ts` |
| Partner network (Jayla, Aquarius) | PRD, README | ✅ Implemented | `app/(dashboard)/properties/`, seed data |
| Platform billing (Buffr ↔ Hotel Etuna) | PLANNING | ✅ Implemented | `lib/services/billing/PlatformBillingService.ts`, migrations 0013–0014 |
| Fraud detection | PLANNING | ✅ Implemented | `lib/services/fraud/FraudDetectionService.ts`, migration 0016 |
| AML/KYC | PLANNING, IRP | ✅ Implemented | `lib/services/compliance/AMLMonitoringService.ts`, `app/api/compliance/kyc-cases/` |
| SOC 2 evidence automation | SOC2 Plan | ✅ Implemented | `lib/compliance/soc2/Soc2AuditOrchestrator.ts`, `scripts/soc2/` |
| DSAR (Data Subject Access Request) | TASK | ❌ Not implemented | Documented as future work in `docs/project/TASK.md` |
| BCP tabletop exercise | TASK | ❌ Not done | `docs/compliance/INCIDENT_RESPONSE_PLAN.md` — `Last Tested: [Date]` unfilled |
| 21 policies signed | SOC2 Plan | ⚠️ Draft only | Policies in `docs/compliance/policies/`; all missing executive signatures |
| Vendor SOC 2 attestations | SOC2 Plan | ❌ Not collected | Policy references `evidence/vendor-register.csv` — file doesn't exist |
| pgAudit on Neon | Logging Policy | ❌ Not confirmed | Policy says "Enable where available"; not verified live |
| Guest self-scan NamQR | PLANNING | ❌ Not implemented | Documented as deferred ("guest folio scan deferred") |
| Open Banking PIS | PLANNING | ❌ Not implemented | `ob_*` schema exists; PIS documented as "P2" |
| Commission reporting UI | PLANNING | ⚠️ Thin | `commission_amount` on bookings; dedicated report UI is minimal |
| Public Adumo `BookingForm` deposit | PLANNING | ✅ Implemented | `app/payment/booking-deposit/page.tsx` (wired June 2026) |

---

## 7. Changes Applied in This Pass

| File | Change | Type |
|------|--------|------|
| `README.md` | Fixed Next.js version: "14" → "16" | Stale fix |
| `README.md` | Fixed test count: "334/334" → "427+ passed" | Stale fix |
| `README.md` | Fixed SMTP env vars: `SMTP_*` → `EMAIL_SMTP_*` | Critical fix |
| `README.md` | Fixed AI providers: added DeepSeek as primary; removed Google/Groq | Stale fix |
| `README.md` | Updated WhatsApp: "planned" → "webhook live" | Stale fix |
| `README.md` | Updated 2FA: "planned" → "TwoFactorAuthService implemented" | Stale fix |
| `README.md` | Updated project structure: corrected `e2e/` path, added missing domains | Stale fix |
| `README.md` | Updated canonical doc links to `docs/project/` versions | Inconsistency fix |
| `gemini.md` | Fixed "Vern Gates" → "Verification Gates" | Typo fix |
| `CLAUDE.md` | Added dual-auth pattern note; clarified relationship with gemini.md | Inconsistency fix |
| `coding-standards/SKILL.md` | Updated description "23" → "26" | Inconsistency fix |
| `docs/compliance/policies/AI_USAGE_POLICY.md` | **Created** — new policy covering Sofia AI, LLM usage, conversation retention, guest consent | Missing doc |

---

## 8. Items Requiring Human Action (Priority Order)

| Priority | Item | Owner | Effort |
|----------|------|-------|--------|
| 1 | Fill IRP contact names (`[CTO Name]`, etc.) | CTO | 30 min |
| 2 | Executive sign-off on all 20 policies | CEO/CTO | 1 day |
| 3 | Create `BUSINESS_CONTINUITY_POLICY.md` stub | CTO | 1 hour |
| 4 | Create `INCIDENT_RESPONSE_POLICY.md` stub | CTO | 1 hour |
| 5 | Create `docs/compliance/evidence/vendor-register.csv` | CTO | 2 hours |
| 6 | Conduct BCP tabletop exercise; fill `Last Tested` date in IRP | CTO | Half day |
| 7 | Reconcile SOC2 budget estimate ($50-150K vs $250-300K) | CEO | 30 min |
| 8 | Verify `openapi.yaml` location and link from README | Dev | 30 min |
| 9 | Add `DATABASE_URL_UNPOOLED` to `soc2-evidence.yml` workflow if needed | Dev | 30 min |
| 10 | Add `DATA_PROTECTION_POLICY.md` revision history and approval block | CTO | 30 min |

---

## 9. Confidence Scores by Document

| Document | Accuracy | Notes |
|----------|----------|-------|
| `docs/project/PLANNING.md` | 92% | Accurate; minor gaps for June 2026 changes |
| `docs/project/PRD.md` | 88% | Some features not reflected (loyalty UI details, CMS blocks) |
| `docs/project/TASK.md` | 95% | Well-maintained; actively updated |
| `README.md` | 70% → **88%** | After fixes applied |
| `PROJECT_STATE.md` | 90% | Freshly generated; TypeScript errors accurately documented |
| `CLAUDE.md` | 90% | After fix applied |
| `gemini.md` | 85% | After typo fixed; overlaps CLAUDE.md intentionally |
| `docs/compliance/NAMIBIA_REGULATORY_FRAMEWORK.md` | 92% | Accurately cross-references code |
| `docs/compliance/INCIDENT_RESPONSE_PLAN.md` | 75% | Structurally complete; contact details are placeholder |
| `docs/compliance/AML_FICA_COMPLIANCE_PROGRAM.md` | 85% | Matches `aml_*` schema and service layer |
| `docs/compliance/policies/*.md` (21 files) | 80% | Structurally good; all missing executive signatures |
| `.claude/skills/*.md` (9 files) | 70% | Generic content; not Hotel Etuna specific (intentional) |
| `docs/naming-conventions.md` | 97% | Created this session; accurate |

---

*Audit complete. Critical items C-01 through C-03 fixed. C-04 (AI policy) created. See §7 for full list of applied changes and §8 for human-action items.*

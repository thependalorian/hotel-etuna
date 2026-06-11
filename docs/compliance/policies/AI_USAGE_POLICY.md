# AI and LLM Usage Policy

**Effective Date:** 2026-06-02  
**Policy Owner:** CTO  
**Review Frequency:** Annual (or on material change to AI capabilities)  
**TSC Reference:** CC6.1, CC6.7, CC2.1  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

This policy governs the use of artificial intelligence (AI) and large language model (LLM) services within Hotel Etuna's platform, with particular focus on **Sofia**, the AI concierge. It establishes requirements for data handling, guest consent, model access, and human oversight to meet SOC 2 Trust Services Criteria and Namibian data protection obligations.

## 2. Scope

This policy applies to:
- Sofia AI concierge (web chat, email channel, WhatsApp webhook, voice adapter)
- All LLM provider API calls (DeepSeek, OpenAI, Anthropic — accessed via `LLMProviderRouter`)
- Qdrant vector database storing RAG knowledge embeddings
- Guest conversation history stored in `ai_conversations` and `ai_messages`
- Staff use of AI-assisted tooling (e.g., AI-generated email drafts, CRM insights)

## 3. Definitions

| Term | Definition |
|------|------------|
| **Sofia** | Hotel Etuna's AI concierge; hub-tenant exclusive; implemented in `lib/services/ai/` |
| **LLM** | Large language model (DeepSeek, OpenAI GPT, Anthropic Claude) accessed via API |
| **RAG** | Retrieval-augmented generation; Sofia's knowledge base in Qdrant (`buffr_rag` collection, 384-dimensional vectors) |
| **Guest conversation** | Any AI-mediated interaction stored in `ai_conversations` / `ai_messages` |
| **PII** | Personally identifiable information including guest name, email, booking details |

## 4. Policy Statements

### 4.1 Hub Exclusivity

Sofia AI SHALL only be accessible to the Hotel Etuna hub tenant. Partner tenants SHALL NOT have access to any AI or LLM features. Enforcement:

- `proxy.ts` middleware returns HTTP 403 for partner tenants attempting to access `/api/ai/*`, `/api/sofia/*`, `/api/crm/*`
- `DataFilterService.ts` enforces tenant scoping on all AI-handled data

### 4.2 Data Minimisation

- Sofia SHALL NOT request or store payment card numbers, full identity document numbers, or health data during AI interactions.
- AI prompts sent to external LLM providers SHALL NOT include raw database credentials, API keys, or platform secrets.
- Guest PII included in LLM context SHALL be limited to the minimum required for the specific interaction (name, booking reference, preferences).

### 4.3 Knowledge Base Integrity

- The RAG knowledge base (`buffr_rag` collection in Qdrant) SHALL contain only Hotel Etuna property information, not guest data.
- Guest long-term memory facts SHALL be stored in Neon PostgreSQL (`crm_guest_memory_facts`, `crm_graph_edges`), not in the Qdrant vector store.
- Knowledge base ingestion (`npm run rag:seed`) SHALL be re-run after material changes to property information documents in `data/hotel-etuna-knowledge/`.

### 4.4 Rate Disclosure Gating

- Sofia SHALL NOT disclose room rates, availability, or booking prices to unauthenticated users.
- Rate-gated responses SHALL be enforced at the prompt level in `SofiaConciergeService` and at the API level via session checks in `app/api/ai/concierge/route.ts`.

### 4.5 Conversation Retention

- Guest conversations SHALL be retained in `ai_conversations` / `ai_messages` for a maximum of **3 years** unless a guest submits a deletion request (DSAR).
- Conversations SHALL be tenant-scoped and accessible only to hub staff with appropriate roles (owner, manager, admin).
- Conversations SHALL NOT be used to train external LLM models without explicit guest consent and legal review.

### 4.6 Human Escalation

- Sofia SHALL escalate to human staff when:
  - Confidence score falls below threshold (configurable in `SofiaConciergeService`)
  - Guest message contains policy keywords (complaints, legal threats, medical emergencies)
  - Guest explicitly requests human assistance
- Escalation SHALL be logged in `ai_conversations.status = 'escalated'`.

### 4.7 LLM Provider Management

- External LLM providers (DeepSeek, OpenAI, Anthropic) SHALL be evaluated against the **Vendor Management Policy** (Critical/High tier).
- LLM API keys SHALL be stored in Vercel environment variables only; never hardcoded.
- Provider failover order: `AI_PROVIDER_ORDER=deepseek,openai,anthropic` (configured via env).
- On complete LLM unavailability, Sofia SHALL return a graceful degradation message (not a blank error).

### 4.8 Staff AI Assistance

- Staff using AI tools to draft guest communications (e.g., email responses via Sofia email generation) SHALL review and approve content before sending.
- AI-generated content SHALL NOT be sent to guests without staff review for factual accuracy and tone.

### 4.9 Audit and Monitoring

- All Sofia interactions SHALL be logged with `tenant_id`, `session_id`, channel, timestamp, and token usage.
- The `ai_conversations_tenant_session_idx` index (migration `0017`) SHALL remain in place to support audit queries.
- PostHog SHALL capture Sofia interaction events for product analytics (non-PII event properties only).

## 5. Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| **CTO (Policy Owner)** | Maintain policy; annual review; approve new LLM providers; respond to AI-related incidents |
| **Developer** | Implement rate gating, tenant isolation, PII minimisation in AI code paths |
| **Hotel Manager** | Monitor escalated conversations; review AI-generated communications before sending |
| **All Staff** | Not use AI tools to bypass access controls or data minimisation requirements |

## 6. Guest Rights

- Guests may request deletion of their conversation history as part of a DSAR (Data Subject Access Request).
- Guests may opt out of post-conversation CRM memory extraction by contacting the hotel.
- Sofia SHALL disclose to guests that they are interacting with an AI system when directly asked.

## 7. Exceptions

Exceptions (e.g., temporary use of a new LLM provider not yet security-reviewed) require:
1. Written approval from the CTO.
2. Entry in the risk register with time-limited approval.
3. Security review within 30 days.

## 8. Enforcement

Violations may result in disciplinary action. Misconfiguration that exposes guest PII to third-party LLMs without consent SHALL be treated as a potential data breach under the **Incident Response Plan**.

## 9. Related Documents

- [`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)

- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)
- [`DATA_PROTECTION_POLICY_NAMIBIA.md`](DATA_PROTECTION_POLICY_NAMIBIA.md)
- [`DATA_RETENTION_POLICY.md`](DATA_RETENTION_POLICY.md)
- [`VENDOR_MANAGEMENT_POLICY.md`](VENDOR_MANAGEMENT_POLICY.md)
- [`../NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)
- Code: `lib/services/ai/`, `lib/services/sofia/`, `lib/compliance/soc2/agents/`

## 10. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-06-10 | CTO | Template conformance + implementation cross-ref |
| 1.0 | 2026-06-02 | CTO | Initial policy; created to address SOC 2 CC6.1 gap for AI data processing |

**Approved by:** _________________________ Date: _________

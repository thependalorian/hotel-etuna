# Data Protection & Privacy Program

**Effective Date:** May 16, 2026  
**Document Owner:** CTO  
**DPO / Privacy Contact:** [Assign]  
**Review Frequency:** Annual  
**Status:** Readiness program — **not legal advice**

---

## 1. Purpose

Establish privacy governance for Hotel Etuna and Buffr ahead of Namibia's **Data Protection Bill** (draft, not yet enacted) and aligned with **Constitution Article 13**, **ETA 2019**, and international best practice (GDPR-style controls where guests are EU/UK).

**Public policy:** `app/legal/privacy/page.tsx`  
**SOC 2 policy:** [`policies/DATA_PROTECTION_POLICY_NAMIBIA.md`](policies/DATA_PROTECTION_POLICY_NAMIBIA.md)

---

## 2. Legal landscape

| Source | Status | Relevance |
|--------|--------|-----------|
| **Constitution of Namibia — Art. 13** | In force | Right to privacy |
| **Electronic Transactions Act 4 of 2019** | In force | Electronic records, consumer processes |
| **Draft Data Protection Bill (2021/2022)** | Not enacted | Future lawful basis, DSAR, breach notification, supervisory authority |
| **GDPR** | Extraterritorial for EU data subjects | Sofia / marketing if EU guests |

When the Bill is enacted, expect a **transition period** (draft suggested ~12 months) — track [NamibLII](https://namiblii.org/akn/na/act/2022/8) and legal counsel updates.

---

## 3. Personal data inventory

| Category | Examples | Systems | Classification |
|----------|----------|---------|----------------|
| Guest identity | Name, email, phone, ID copy (check-in) | Neon DB, CRM | Confidential |
| Booking & stay | Dates, room, folio, preferences | PMS tables, folio | Confidential |
| Payment metadata | Adumo session refs, NamQR refs (no PAN) | `transactions`, webhooks | Restricted metadata |
| Staff | HR records, roles, audit actor IDs | `users`, `staff` | Confidential |
| AI / Sofia | Chat content, embeddings | Qdrant, logs | Confidential |
| Marketing | Newsletter opt-in | CRM consent | Confidential |

**Engineering rule:** Minimise PII in `audit_trail.new_values` — see `regulatory-context.ts`.

---

## 4. Lawful basis (operational mapping)

Until Namibian Bill is enacted, use this **working matrix** (counsel to confirm):

| Processing | Basis | Implementation |
|------------|-------|----------------|
| Booking contract | Contract performance | Account + reservation |
| Payment | Contract + legal obligation | Adumo / folio |
| Marketing email | Consent | CRM consent API + audit |
| Fraud / AML | Legitimate interest / legal obligation | AML tables |
| Analytics | Consent or legitimate interest | Cookie policy; banner **G-06** |
| Sofia support | Contract / consent | Guest session |

---

## 5. Data subject rights (DSAR program)

| Right | Target process | Product gap |
|-------|----------------|-------------|
| Access | Verify identity → export within 30 days | Manual + DB export; **portal G-01** |
| Correction | CRM / profile update | Guest profile APIs |
| Deletion | Anonymise where retention allows | Retention policy § legal holds |
| Objection | Stop marketing | Consent revoke |
| Portability | JSON export | Backlog |

**Workflow:**

1. Request via privacy@hoteletuna.com (or in-app form when built).
2. Log in `consumer_rights_requests` with deadline.
3. Identity verification (booking ref + ID).
4. Fulfill via `RegulatoryLifecycleService` / manual export.
5. Record completion in audit trail.

---

## 6. Security measures (technical)

| Control | Reference |
|---------|-----------|
| Encryption in transit | TLS 1.3 (Vercel) |
| Encryption at rest | Neon AES-256 |
| Access control | RLS, RBAC — [`ACCESS_CONTROL_POLICY.md`](policies/ACCESS_CONTROL_POLICY.md) |
| Breach response | [`INCIDENT_RESPONSE_PLAN.md`](INCIDENT_RESPONSE_PLAN.md) |
| Preflight | `npm run security:preflight` |

---

## 7. Breach notification

| Audience | Trigger | Timeline |
|----------|---------|----------|
| Internal IRT | Suspected PII exposure | Immediate |
| Executive / legal | Confirmed breach | 24h |
| Namibian authority | When Bill requires + materiality test | Per counsel (draft Bill: supervisory authority) |
| Data subjects | High risk to rights | Per counsel |
| BoN | If payment system impact | PSD-12 72h — IRP |

---

## 8. DPIA triggers

Conduct Data Protection Impact Assessment before:

- New payment rail or open banking PIS
- Large-scale profiling (CRM + AI personalization)
- Cross-border transfer of guest data outside Namibia
- Biometric or ID document storage in app

**Template:** Counsel-provided; store under `docs/compliance/evidence/privacy/`.

---

## 9. Third-party processors

| Processor | Data | DPA status |
|-----------|------|------------|
| Vercel | Hosting, logs | Vendor SOC 2 — Week 8 |
| Neon | Database | Vendor SOC 2 — Week 8 |
| Adumo | Payment metadata | PCI + DPA |
| OpenAI | Embeddings / chat | DPA + data processing terms |
| Qdrant | Vectors | Self-hosted / cloud DPA |

Maintain subprocessor list in vendor risk assessment.

---

## 10. Training & awareness

- Annual privacy training for all staff (SOC 2 CC2.2).
- Developers: [`SECURITY_PROMPT_PACK.md`](../SECURITY_PROMPT_PACK.md) §1, §4, §8.

---

## 11. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | CTO | Initial privacy program |

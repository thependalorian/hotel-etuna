# Vendor risk assessment 2026 — Hotel Etuna

**Effective date:** 2026-06-10  
**Owner:** CTO  
**TSC reference:** CC9.1, CC9.2  
**Register:** `compliance/evidence/vendor-register.csv`

---

## Critical vendors

### Vercel Inc.

| Field | Assessment |
|-------|------------|
| Service | Application hosting, TLS, edge, serverless functions |
| Data processed | Guest/staff HTTP traffic; env secrets at runtime |
| Risk tier | **Critical** |
| Certifications requested | SOC 2 Type II (current year) |
| Contract | MSA/TOS; DPA if available |
| Data residency | US/EU regions (configure `iad1` primary) |
| CUEC | Restrict deploy team; MFA; review audit logs |
| Evidence path | `compliance/evidence/vendor-attestations/received/vercel-soc2-type2-2026.pdf` |
| Review date | 2026-06-10 (initial) / annual |

### Neon (PostgreSQL)

| Field | Assessment |
|-------|------------|
| Service | Primary database — all PII, audit_trail, payments metadata |
| Risk tier | **Critical** |
| Certifications requested | SOC 2 Type II |
| Controls | SSL required, IP allowlist recommended, PITR enabled |
| CUEC | Parameterized SQL only; RLS verification each release |
| Evidence path | `compliance/evidence/vendor-attestations/received/neon-soc2-type2-2026.pdf` |
| pgAudit | Enable per `scripts/compliance/enable-pgaudit.sql` |

### Adumo (Namibia)

| Field | Assessment |
|-------|------------|
| Service | Hosted payment page — card data not stored on Hotel Etuna |
| Risk tier | **Critical** |
| Certifications requested | PCI DSS AOC or merchant security attestation |
| Scope | PCI **carved out** — complementary controls on webhook integrity |
| CUEC | Verify webhook signatures; idempotent handlers; fraud gate |
| Evidence path | `compliance/evidence/vendor-attestations/received/adumo-pci-aoc-2026.pdf` |

---

## High vendors

| Vendor | Service | Due diligence |
|--------|---------|---------------|
| Qdrant Cloud | Sofia RAG vectors | Security whitepaper; no guest PII in KB |
| OpenAI / Anthropic / DeepSeek | LLM inference | DPA; no secrets in prompts; data minimisation |
| Resend / SMTP | Transactional email | TLS; no PAN in email bodies |
| Stack Auth | Staff authentication | MFA policy; session hygiene |

---

## Medium / Low

PostHog (analytics, non-PII events), Cloudflare (if used), design tools — privacy review only.

---

## Annual refresh checklist

- [ ] Re-request SOC 2 / PCI from Critical vendors
- [ ] Update CUEC worksheet signatures
- [ ] Review subprocessors list for changes
- [ ] File summary in `compliance/evidence/2026-MM/vendor-review.md`

**Next review:** 2027-01-15

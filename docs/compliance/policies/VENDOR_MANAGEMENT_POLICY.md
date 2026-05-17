# Vendor Management Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC9.1–CC9.2  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Manage third-party risk for vendors that process, store, or transmit Hotel Etuna data or provide critical infrastructure.

## 2. Scope

All SaaS, payment, cloud, AI, and professional service vendors. Includes subprocessors engaged by primary vendors.

## 3. Risk tiers

| Tier | Criteria | Examples | Due diligence |
|------|----------|----------|---------------|
| **Critical** | Processes payments, hosts production DB, or holds Restricted data | Vercel, Neon, Adumo | SOC 2 / PCI attestation, DPA, annual review |
| **High** | Processes Confidential data or is single point of failure | Qdrant, Resend, Cloudflare, OpenAI/Anthropic | Security questionnaire + contract terms |
| **Medium** | Internal or analytics; limited PII | PostHog, Grafana (if used) | Privacy review + data minimisation |
| **Low** | No production data | Design tools, static CDN | Basic terms review |

## 4. Onboarding requirements

Before production use of a Critical or High tier vendor:

1. **Business justification** documented (owner, data types, regions).
2. **Contract** includes confidentiality, breach notification (≤72h), subprocessors, and data return/deletion on termination.
3. **Attestations** collected where available (SOC 2 Type II, PCI DSS AOC for Adumo).
4. **Access** limited to least privilege; API keys in Vercel env / 1Password only.
5. **Register** entry in vendor inventory (`docs/compliance/evidence/vendor-register.csv` or equivalent).

## 5. Ongoing monitoring

- **Annual** review of Critical vendors; re-collect attestations before expiry.
- **Quarterly** check for vendor security advisories affecting our stack.
- **Incident** — if vendor reports breach, activate [`INCIDENT_RESPONSE_PLAN.md`](../INCIDENT_RESPONSE_PLAN.md) and assess guest impact.
- **Offboarding** — revoke keys, export required records, confirm deletion per DPA within 30 days.

## 6. Prohibited practices

- Storing production credentials in vendor support tickets or public repos.
- Using consumer-tier accounts for production payment or database workloads without approval.
- Bypassing procurement for Critical tier vendors.

## 7. Evidence

- Signed contracts and DPAs in secure storage (not git).
- Attestation PDFs in `compliance/evidence/vendors/YYYY/`.
- G-09 gap register until all Critical packs on file.

## 8. Related documents

- [`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md) §6 (G-09)  
- [`DATA_PROTECTION_POLICY_NAMIBIA.md`](DATA_PROTECTION_POLICY_NAMIBIA.md)

## 9. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 17, 2026 | CTO | Initial policy |

**Approved by:** _________________________ Date: _________

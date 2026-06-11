# Security Awareness Training Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** HR / CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC2.2  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Ensure staff understand security responsibilities, common threats, and Hotel Etuna-specific controls.

## 2. Scope

All employees and contractors with access to systems, email, or guest information.


## Definitions

| Term | Definition |
|------|------------|
| **Hotel Etuna** | Hub hospitality platform and operating entity |
| **Personnel** | Employees, contractors, and partners with access to Hotel Etuna systems |
| **Production** | Live environment serving guests and partners (Vercel + Neon production branch) |

## 3. Training requirements

| Audience | Content | Timing | Evidence |
|----------|---------|--------|----------|
| **All staff** | Phishing, password hygiene, physical security, incident reporting | Within 30 days of hire; **annual** refresher | Signed attendance or LMS completion |
| **Front desk / F&B** | Guest data handling, POS hygiene, social engineering | Annual | Training log |
| **Developers / admins** | Secure coding, OWASP top 10, Security Prompt Pack §1–5 overview | Annual + on role change | GitHub security module or internal session notes |
| **Managers** | Access reviews, vendor incidents, BoN 72h reporting awareness | Annual | Manager briefing minutes |

## 4. Curriculum topics (minimum)

1. Data classification and need-to-know.
2. Recognising phishing and invoice fraud (relevant to Namibian EFT scams per NPS trends).
3. Safe use of AI tools — no pasting Restricted/Confidential data into public LLMs without approval.
4. How to report incidents (IRT contacts in Incident Response Plan).
5. Acceptable Use and Password policies acknowledgment.

## 5. Delivery

- Live briefing, recorded video, or approved third-party module (e.g. KnowBe4) acceptable.
- New major threats (e.g. active campaign) → ad-hoc bulletin within 5 business days.

## 6. Compliance tracking

HR maintains `compliance/evidence/training/YYYY-staff-training-register.csv` with: name, role, date completed, module version.

Non-completion after 60 days → manager escalation; admin access suspended until complete (CTO exception for emergency).

## 7. Related documents
- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)

- [`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)

- [`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)

- [`HR_SECURITY_POLICY.md`](HR_SECURITY_POLICY.md)  
- [`INCIDENT_RESPONSE_PLAN.md`](../INCIDENT_RESPONSE_PLAN.md)  
- [`../SECURITY_PROMPT_PACK.md`](../../SECURITY_PROMPT_PACK.md)

## Exceptions

Exceptions require written approval from the Policy Owner and Executive Sponsor. Document compensating controls in the risk register.

## Enforcement

Violations may result in disciplinary action up to termination and reporting to regulators where required.

## 8. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-06-10 | CTO | Template conformance + implementation cross-ref |
| 1.0 | May 17, 2026 | HR | Initial policy |

**Approved by:** _________________________ Date: _________

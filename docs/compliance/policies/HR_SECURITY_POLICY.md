# HR Security Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** HR / Operations Manager  
**Review Frequency:** Annual  
**TSC Reference:** CC2.1  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Integrate personnel security practices into hiring, employment, and termination for roles with access to Hotel Etuna systems or guest data.

## 2. Scope

Employees, contractors, and temporary staff at Hotel Etuna and Buffr (platform operator).


## Definitions

| Term | Definition |
|------|------------|
| **Hotel Etuna** | Hub hospitality platform and operating entity |
| **Personnel** | Employees, contractors, and partners with access to Hotel Etuna systems |
| **Production** | Live environment serving guests and partners (Vercel + Neon production branch) |

## 3. Pre-employment

| Control | Requirement |
|---------|-------------|
| **Role definition** | Job description states data access level and confidentiality obligations |
| **Background checks** | Criminal/reference checks for roles with financial, payment, or full PII access (manager discretion for front-line only) |
| **Confidentiality** | Signed NDA / employment terms before system access |
| **Security briefing** | Overview of Acceptable Use and Password policies on day one |

## 4. During employment

- Access provisioned only after manager approval (see Access Control Policy).
- Annual security awareness training (Training Policy).
- Prompt reporting of policy violations or suspicious guest/staff behaviour.
- Conflicts of interest disclosed to management (Code of Conduct).

## 5. Role changes

- Promotion or transfer: update RBAC within 48 hours; remove obsolete permissions.
- Leave of absence >30 days: disable admin access unless business-critical and approved.

## 6. Termination / offboarding

Within **24 hours** of last working day:

1. Disable user account in application (`users` / auth provider).
2. Revoke GitHub, Vercel, Neon, 1Password, email access.
3. Collect company devices; confirm remote wipe if applicable.
4. Rotate shared secrets the individual could access.
5. HR exit interview reminder on confidentiality survival.

Contractors: same timeline; API keys revoked immediately.

## 7. Disciplinary process

Security policy violations may result in warning, suspension, termination, and regulatory notification where legally required. Document in HR file (not in public git).

## 8. Related documents
- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)

- [`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)

- [`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)

- [`ACCEPTABLE_USE_POLICY.md`](ACCEPTABLE_USE_POLICY.md)  
- [`ACCESS_CONTROL_POLICY.md`](ACCESS_CONTROL_POLICY.md)  
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)  
- [`TRAINING_POLICY.md`](TRAINING_POLICY.md)

## Exceptions

Exceptions require written approval from the Policy Owner and Executive Sponsor. Document compensating controls in the risk register.

## Enforcement

Violations may result in disciplinary action up to termination and reporting to regulators where required.

## 9. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-06-10 | CTO | Template conformance + implementation cross-ref |
| 1.0 | May 17, 2026 | HR | Initial policy |

**Approved by:** _________________________ Date: _________

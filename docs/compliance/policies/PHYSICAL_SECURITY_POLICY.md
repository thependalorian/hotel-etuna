# Physical Security Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** Operations Manager  
**Review Frequency:** Annual  
**TSC Reference:** CC6.4  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Protect physical access to Hotel Etuna premises, on-site systems, and staff devices that may hold Confidential data.

## 2. Scope

Hotel Etuna property (Windhoek operations), front-desk workstations, POS/tablet devices, paper records, and staff laptops used for administration.


## Definitions

| Term | Definition |
|------|------------|
| **Hotel Etuna** | Hub hospitality platform and operating entity |
| **Personnel** | Employees, contractors, and partners with access to Hotel Etuna systems |
| **Production** | Live environment serving guests and partners (Vercel + Neon production branch) |

## 3. On-premises controls

| Control | Requirement |
|---------|-------------|
| **Access** | Keys/cards issued to authorised staff only; lost keys reported same day |
| **Visitors** | Escorted in back-office areas; sign-in log where practicable |
| **Front desk** | Screen lock when unattended; no guest-visible display of admin credentials |
| **Cash / documents** | Secure drawer or safe for sensitive paperwork per hotel SOP |
| **CCTV** | Where installed, retained per local law; not a substitute for logical access controls |

## 4. Device security

- Laptops and tablets SHALL use screen lock (≤5 min) and device PIN/biometric.
- USB storage of guest exports prohibited unless CTO-approved encrypted drive.
- Clean desk: confidential printouts shredded or locked when not in use.

## 5. Cloud / data centre

Production application and database physical security is **inherited** from Vercel and Neon (SOC 2 Type II). Evidence: vendor attestations per Vendor Management Policy.

## 6. Incidents

Theft, break-in, or lost device with work data → report to Incident Commander within 1 hour; follow [`INCIDENT_RESPONSE_PLAN.md`](../INCIDENT_RESPONSE_PLAN.md).

## 7. Related documents
- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)

- [`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)

- [`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)

- [`ASSET_MANAGEMENT_POLICY.md`](ASSET_MANAGEMENT_POLICY.md)  
- [`ACCEPTABLE_USE_POLICY.md`](ACCEPTABLE_USE_POLICY.md)

## Exceptions

Exceptions require written approval from the Policy Owner and Executive Sponsor. Document compensating controls in the risk register.

## Enforcement

Violations may result in disciplinary action up to termination and reporting to regulators where required.

## 8. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-06-10 | CTO | Template conformance + implementation cross-ref |
| 1.0 | May 17, 2026 | Operations | Initial policy |

**Approved by:** _________________________ Date: _________

# Data Classification Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC6.7  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Establish a consistent scheme for classifying information so that protection, access, retention, and sharing controls match data sensitivity.

## 2. Scope

All data created, received, stored, or processed by Hotel Etuna (Buffr Host platform), including guest PII, payment metadata, partner data, staff records, and system secrets.


## Definitions

| Term | Definition |
|------|------------|
| **Hotel Etuna** | Hub hospitality platform and operating entity |
| **Personnel** | Employees, contractors, and partners with access to Hotel Etuna systems |
| **Production** | Live environment serving guests and partners (Vercel + Neon production branch) |

## 3. Classification levels

| Level | Definition | Examples | Minimum controls |
|-------|------------|----------|------------------|
| **Restricted** | Severe harm if disclosed; regulatory or contractual breach | API keys, DB credentials, Adumo tokens, raw card data (must not be stored) | Encrypted at rest & transit; MFA; need-to-know; audit log; 1Password + Vercel env only |
| **Confidential** | Sensitive business or personal data | Guest PII, folios, bookings, KYC, AML notes, staff access lists | TLS 1.2+; RLS tenant isolation; RBAC; encrypted Neon |
| **Internal** | Non-public operational data | Policies, runbooks, internal metrics, draft marketing | Staff/partner roles only; no public URLs |
| **Public** | Approved for external release | Published room rates (after approval), public website copy, press releases | Integrity checks on publish path; no embedded secrets |

## 4. Handling requirements

### 4.1 Labeling

- New database columns holding PII or financial data SHALL be documented in schema comments and PRD data maps.
- Exports (CSV, reports) SHALL be labeled with classification in filename or cover sheet (e.g. `confidential-guest-export-YYYY-MM-DD.csv`).

### 4.2 Storage and transmission

- **Restricted** and **Confidential** data SHALL NOT be sent via unencrypted email, public chat, or personal devices.
- Production data SHALL NOT be copied to local laptops except encrypted, time-limited exports approved by CTO.
- Sandbox/test environments SHALL use synthetic or anonymised data unless CTO approves a masked production subset.

### 4.3 Sharing

- Third-party sharing requires Vendor Management Policy due diligence and DPA where applicable.
- Cross-tenant access is prohibited except platform admin with logged justification (`recordAudit`).

## 5. Roles

| Role | Responsibility |
|------|----------------|
| Data owners (module leads) | Classify new data types; approve access patterns |
| CTO | Enforce technical controls (RLS, encryption, retention jobs) |
| All staff | Handle data per classification; report misclassification |

## 6. Related documents

- [`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)

- [`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)

- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md) §4.1  
- [`DATA_RETENTION_POLICY.md`](DATA_RETENTION_POLICY.md)  
- [`DATA_PROTECTION_POLICY_NAMIBIA.md`](DATA_PROTECTION_POLICY_NAMIBIA.md)  
- [`ACCESS_CONTROL_POLICY.md`](ACCESS_CONTROL_POLICY.md)

## Exceptions

Exceptions require written approval from the Policy Owner and Executive Sponsor. Document compensating controls in the risk register.

## Enforcement

Violations may result in disciplinary action up to termination and reporting to regulators where required.

## 7. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-06-10 | CTO | Template conformance + implementation cross-ref |
| 1.0 | May 17, 2026 | CTO | Initial policy |

**Approved by:** _________________________ Date: _________

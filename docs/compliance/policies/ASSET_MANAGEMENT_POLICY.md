# Asset Management Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC6.2  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Identify, track, and protect Hotel Etuna information assets throughout their lifecycle.

## 2. Scope

Software (application, repos, dependencies), cloud resources, data stores, cryptographic keys, and company-issued or BYOD devices used for work.


## Definitions

| Term | Definition |
|------|------------|
| **Hotel Etuna** | Hub hospitality platform and operating entity |
| **Personnel** | Employees, contractors, and partners with access to Hotel Etuna systems |
| **Production** | Live environment serving guests and partners (Vercel + Neon production branch) |

## 3. Asset categories

| Category | Inventory source | Owner |
|----------|------------------|-------|
| **Application** | GitHub `thependalorian/hotel-etuna` | CTO |
| **Database** | Neon project (production + staging) | CTO |
| **Secrets** | Vercel env, 1Password vault | CTO |
| **Domains & DNS** | Registrar / Cloudflare | Operations |
| **Endpoints** | Staff laptop register (spreadsheet) | HR + CTO |
| **Dependencies** | `package.json` / `package-lock.json` | Engineering |

## 4. Requirements

### 4.1 Registration

- New production services or domains SHALL be added to the asset register within 5 business days.
- Critical assets SHALL list: name, owner, classification (per Data Classification Policy), vendor, and recovery procedure reference.

### 4.2 Lifecycle

- **Acquisition** — approved by CTO for production; security review for payment- or PII-touching components.
- **Maintenance** — patch per Change Management Policy; dependency updates monthly.
- **Disposal** — revoke access, delete data per Retention Policy, rotate any shared secrets.

### 4.3 Physical devices

- Company laptops SHALL use full-disk encryption and screen lock ≤5 minutes.
- Lost/stolen devices: report within 1 hour; remote wipe where MDM available.

## 5. Roles

| Role | Responsibility |
|------|----------------|
| CTO | Maintain cloud/software inventory; approve new assets |
| Engineering | Declare new repos, APIs, and integrations in PR |
| All staff | Report lost devices; no unapproved shadow IT |

## 6. Related documents
- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)

- [`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)

- [`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)

- [`CHANGE_MANAGEMENT_POLICY.md`](CHANGE_MANAGEMENT_POLICY.md)  
- [`BUSINESS_CONTINUITY_PLAN.md`](../BUSINESS_CONTINUITY_PLAN.md)

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

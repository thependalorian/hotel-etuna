# Data Retention Policy

**Effective Date:** May 16, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC6.5  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Define how long Hotel Etuna retains data to meet legal, tax, and operational needs while minimising privacy risk.

## 2. Scope

All electronic records in Neon, Qdrant, Vercel logs, backups, and offline exports.


## Definitions

| Term | Definition |
|------|------------|
| **Hotel Etuna** | Hub hospitality platform and operating entity |
| **Personnel** | Employees, contractors, and partners with access to Hotel Etuna systems |
| **Production** | Live environment serving guests and partners (Vercel + Neon production branch) |

## 3. Retention schedule

| Data type | Retention period | Legal / business basis | Deletion method |
|-----------|------------------|------------------------|-----------------|
| Guest booking & folio | 7 years after checkout | Tax / contract | Anonymise PII; retain financial lines |
| Tax invoices & VAT reports | 7 years | NamRA | Archive + secure delete after period |
| Payment transaction metadata | 7 years | FICA / audit | DB purge job (counsel-approved) |
| `audit_trail` | 7 years | ETA / SOC 2 | Partition or export then purge |
| `cybersecurity_incidents` | 7 years | PSD-12 | Archive |
| AML / STR records | 5 years minimum post-report | FICA | No early delete |
| KYC documents | Life of relationship + 5 years | FICA | Secure wipe |
| Application logs (Vercel) | 7 days (platform) | Operational | Export monthly to evidence folder |
| Sofia chat logs | 24 months | Service improvement | Anonymise or delete |
| Marketing consent records | Life of consent + 3 years | Proof of consent | CRM flag |
| Staff HR (off-platform) | Per Labour Act | Employment | HR system |
| Backups | 30 days rolling (Neon PITR) | DR | Auto-expire |

## 4. Legal hold

When litigation or regulatory investigation is notified, suspend deletion for affected records until legal clears hold.

## 5. Secure disposal

- Production data: SQL delete + verify; rotate credentials if breach-related.
- Paper: cross-cut shred.
- Laptops: NIST wipe before reuse.

## 6. Roles

| Role | Responsibility |
|------|----------------|
| CTO | Implement retention jobs |
| Finance | Approve tax record destruction |
| Legal | Issue legal holds |

## Exceptions

Exceptions require written approval from the Policy Owner and Executive Sponsor. Document compensating controls in the risk register.

## Enforcement

Violations may result in disciplinary action up to termination and reporting to regulators where required.

## Related Documents

- [`DATA_PROTECTION_POLICY_NAMIBIA.md`](DATA_PROTECTION_POLICY_NAMIBIA.md)
- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)
- [`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)
- [`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)

## 7. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.2 | 2026-06-10 | CTO | Retention services + Vercel cron wired; unit tests added |
| 1.1 | 2026-06-10 | CTO | Template conformance + implementation cross-ref |
| 1.0 | May 16, 2026 | CTO | Initial schedule |

## Implementation notes (2026-06-10)

| Data class | Service / route | Schedule |
|------------|-----------------|----------|
| Financial records (7y) | `RetentionEnforcementService` | `vercel.json` cron → `/api/cron/retention-enforcement` |
| Sofia chat (24mo) | `SofiaChatRetentionService` | Same cron (tenant-scoped purge + audit) |
| Dry-run evidence | `?dryRun=true` on cron | Archive to `compliance/evidence/YYYY-MM/retention-dry-run.json` |

**Tests:** `tests/unit/retention-enforcement-service.test.ts`, `tests/unit/sofia-chat-retention.test.ts`  
**Validate:** `npm run validate:policy-implementation` (POL-12)

**Approved by:** _________________________ Date: _________

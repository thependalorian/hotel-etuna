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

## 7. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | CTO | Initial schedule |

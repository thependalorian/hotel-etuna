# Backup Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC7.1  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Ensure Hotel Etuna data can be recovered after corruption, deletion, or disaster.

## 2. Scope

Neon PostgreSQL (production), Qdrant vectors (if production-critical), Vercel deployment configuration, and evidence archives.

## 3. Backup strategy

| Asset | Method | Frequency | Retention |
|-------|--------|-----------|-----------|
| **Neon production DB** | Point-in-time recovery (PITR) + automated backups | Continuous / daily | 30 days (verify Neon plan) |
| **Schema** | Drizzle migrations in git | Every change | Indefinite (version control) |
| **Application** | Git `main` + Vercel deployments | Every deploy | Rollback via Vercel |
| **Secrets** | 1Password vault export (encrypted) | Quarterly | 1 year offline copy |
| **Compliance evidence** | `compliance/evidence/` git or secure drive | Monthly | 7 years |

## 4. Recovery objectives

Aligned with [`BUSINESS_CONTINUITY_PLAN.md`](../BUSINESS_CONTINUITY_PLAN.md):

| Metric | Target |
|--------|--------|
| **RTO** (booking/payment restore) | 4 hours |
| **RPO** (acceptable data loss) | 1 hour (Neon PITR) |

## 5. Testing

- **Semi-annual** restore test to staging: restore Neon branch or PITR snapshot; verify login, booking read, migration version.
- Document results in `compliance/evidence/YYYY-MM/backup-restore-test.md`.
- Failed test → corrective action within 30 days.

## 6. Responsibilities

| Role | Action |
|------|--------|
| CTO | Own backup config; run restore tests |
| Engineering | Never deploy destructive migration without backup confirmation |
| Operations | Follow BCP communication during extended outage |

## 7. Prohibited

- Relying solely on manual SQL dumps without testing restore.
- Storing unencrypted production backups on personal devices.

## 8. Related documents

- [`BUSINESS_CONTINUITY_PLAN.md`](../BUSINESS_CONTINUITY_PLAN.md)  
- [`CHANGE_MANAGEMENT_POLICY.md`](CHANGE_MANAGEMENT_POLICY.md)

## 9. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 17, 2026 | CTO | Initial policy |

**Approved by:** _________________________ Date: _________

# Change Management Policy

**Effective Date:** May 16, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC8.1  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Ensure changes to Hotel Etuna production systems are planned, tested, approved, and traceable for SOC 2 and payment system stability.

## 2. Scope

Application code, database migrations, infrastructure (Vercel, Neon), environment variables, and payment/NamQR configuration.


## Definitions

| Term | Definition |
|------|------------|
| **Hotel Etuna** | Hub hospitality platform and operating entity |
| **Personnel** | Employees, contractors, and partners with access to Hotel Etuna systems |
| **Production** | Live environment serving guests and partners (Vercel + Neon production branch) |

## 3. Change categories

| Category | Examples | Approval |
|----------|----------|----------|
| **Standard** | Bug fix, UI tweak | 1 peer review + CI green |
| **Significant** | New API, RLS change, payment flow | 2 reviewers + security §14 review |
| **Emergency** | Active incident hotfix | CTO verbal + retroactive PR within 24h |

## 4. Required process

1. **Ticket / TASK.md** reference for significant changes.
2. **Branch + PR** with description, test plan, rollback notes.
3. **CI:** lint, typecheck, tests, `npm run security:preflight` before production deploy.
4. **Database:** forward-only Drizzle migrations in `database/drizzle/`; verify RLS after schema change (`scripts/db/verify-tenant-rls.ts`).
5. **Deploy:** Vercel production from `main` only (or approved release branch).
6. **Post-deploy:** smoke test booking, login, payment sandbox path.
7. **Documentation:** update PRD/TASK when behaviour changes.

## 5. Prohibited changes

- Direct production DB edits without migration file
- Disabling audit logging or RLS in production
- Deploying with failing preflight or critical `npm audit` without documented exception
- Sharing production credentials in PR comments

## 6. Evidence

- Git commit history
- PR approvals (GitHub)
- Migration files
- Monthly export to `docs/compliance/evidence/YYYY-MM/`

## Exceptions

Exceptions require written approval from the Policy Owner and Executive Sponsor. Document compensating controls in the risk register.

## Enforcement

Violations may result in disciplinary action up to termination and reporting to regulators where required.

## Related Documents

- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)
- [`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)
- [`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)

## 7. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-06-10 | CTO | Template conformance + implementation cross-ref |
| 1.0 | May 16, 2026 | CTO | Initial policy |

**Approved by:** _________________________ Date: _________

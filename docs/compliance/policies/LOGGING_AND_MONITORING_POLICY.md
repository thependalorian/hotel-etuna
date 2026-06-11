# Logging and Monitoring Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC7.2  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Ensure security-relevant events are logged, retained, and reviewed to detect and investigate incidents.

## 2. Scope

Application audit trail, authentication events, payment and fraud actions, infrastructure logs, and compliance exports.


## Definitions

| Term | Definition |
|------|------------|
| **Hotel Etuna** | Hub hospitality platform and operating entity |
| **Personnel** | Employees, contractors, and partners with access to Hotel Etuna systems |
| **Production** | Live environment serving guests and partners (Vercel + Neon production branch) |

## 3. What to log

| Event type | Minimum fields | Storage |
|------------|----------------|---------|
| **Authentication** | user id, success/fail, IP, timestamp | `audit_trail` + Vercel logs |
| **Authorization failures** | role, route, tenant | `audit_trail` |
| **Data changes (sensitive)** | actor, entity, action, tenant | `recordAudit()` / `audit_trail` |
| **Payments** | session id, amount, status (no PAN) | `transactions`, `payment_sessions` |
| **Fraud** | decision, risk score, rule hits | fraud tables + gate logs |
| **Admin / platform** | platform admin actions | `audit_trail` with elevated flag |
| **Cyber incidents** | severity, status, BoN refs | `cybersecurity_incidents` |

Logs SHALL NOT contain passwords, API secrets, full PAN, or CVV.

## 4. Retention

| Source | Retention | Notes |
|--------|-----------|-------|
| `audit_trail` | 7 years | Per Data Retention Policy |
| Vercel function logs | 7 days (platform) | Monthly export to `compliance/evidence/YYYY-MM/` |
| Neon / pgAudit | Per Neon plan | Enable where available |
| Fraud alerts | 7 years | Regulatory alignment |

**Implementation note (2026-06-10):** pgAudit on Neon is **not yet confirmed enabled** (TASK.md Production Gap #6). Requirement stands; track remediation in [`IMPLEMENTATION_VALIDATION_2026-06-10.md`](../../../compliance/evidence/policies/IMPLEMENTATION_VALIDATION_2026-06-10.md).

## 5. Monitoring activities

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Failed login spike review | Weekly | CTO |
| `npm audit` / dependabot | Weekly | Engineering |
| Security preflight | Each production deploy | Engineering |
| SOC 2 evidence export | Monthly | Technical Lead |
| Uptime / error rate | Continuous | Vercel dashboard |

Alert thresholds and on-call rotation documented in [`INCIDENT_RESPONSE_PLAN.md`](../INCIDENT_RESPONSE_PLAN.md).

## 6. Prohibited

- Disabling audit logging in production.
- Tampering with or deleting `audit_trail` rows except approved retention purge jobs.
- Logging Restricted secrets at INFO level.

## 7. Related documents
- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)

- [`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)

- [`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)

- [`DATA_RETENTION_POLICY.md`](DATA_RETENTION_POLICY.md)  
- [`INCIDENT_RESPONSE_PLAN.md`](../INCIDENT_RESPONSE_PLAN.md)  
- [`lib/compliance/record-audit.ts`](../../../lib/compliance/record-audit.ts)

## Exceptions

Exceptions require written approval from the Policy Owner and Executive Sponsor. Document compensating controls in the risk register.

## Enforcement

Violations may result in disciplinary action up to termination and reporting to regulators where required.

## 8. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.2 | 2026-06-10 | CTO | Runtime anchors: record-audit, export-audit-trail, verify-pgaudit script |
| 1.1 | 2026-06-10 | CTO | Template conformance + implementation cross-ref |
| 1.0 | May 17, 2026 | CTO | Initial policy |

## Implementation notes (2026-06-10)

| Control | Runtime anchor | Verify |
|---------|----------------|--------|
| Application audit events | `lib/compliance/record-audit.ts` → `audit_trail` | SOC2 monitoring agent |
| Monthly archive | `scripts/compliance/export-audit-trail.ts` | `export-monthly-evidence.ts` |
| DB statement audit | `scripts/compliance/enable-pgaudit.sql` | `npm run verify:pgaudit` (**operator gate IMP-01**) |
| CI evidence | `.github/workflows/soc2-evidence.yml` | Weekly workflow + artifacts |

**Approved by:** _________________________ Date: _________

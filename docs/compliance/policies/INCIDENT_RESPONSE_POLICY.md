# Incident Response Policy

**Effective Date:** 2026-06-02  
**Policy Owner:** CTO  
**Review Frequency:** Biannual  
**TSC Reference:** CC7.3, CC7.4, CC7.5  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Establish requirements for detecting, reporting, containing, and recovering from security incidents affecting Hotel Etuna systems or guest data.

## 2. Scope

All cybersecurity incidents, data breaches, payment system failures, and compliance violations affecting Hotel Etuna production systems or guest data.

## 3. Incident Definition

Any event that compromises (or threatens to compromise) the **confidentiality, integrity, or availability** of Hotel Etuna systems or data. Includes suspected incidents pending confirmation.

## 4. Reporting Requirements

| Incident Type | Internal Notification | BoN Notification (PSD-12) | Guest Notification |
|--------------|----------------------|---------------------------|--------------------|
| **P1 — Data breach** | Immediately | Within 72 hours | Within 72 hours if high risk |
| **P1 — Payment system breach** | Immediately | Within 24 hours | As required |
| **P2 — Unauthorized access** | Within 1 hour | If data affected: 72 hours | If personal data exposed |
| **P3/P4 — Minor incidents** | Within 24 hours | Not required | Not required |

## 5. Mandatory Actions

1. **Detect** — Log incident in `cybersecurity_incidents` table via API or direct DB insert.
2. **Contain** — Revoke compromised credentials immediately; isolate affected systems.
3. **Assess** — Determine scope, data affected, and regulatory thresholds.
4. **Notify** — Follow notification schedule above. BoN contact: Cybersecurity Unit.
5. **Eradicate** — Remove threat; patch vulnerability; rotate credentials.
6. **Recover** — Restore from clean state; verify with `npm run test:db` + smoke tests.
7. **Post-incident** — Complete incident report within 5 days; update procedures.

## 6. Incident Commander Responsibilities

The Incident Commander (CTO or delegated senior staff) MUST:
- Activate the Incident Response Team within 15 minutes of P1 detection.
- Make the BoN notification decision within 24 hours of P1 confirmation.
- Ensure all actions are documented in real time.
- Authorize public communications (guest emails, website notices).

## 7. Prohibited Actions During Incidents

- Do NOT attempt forensic investigation without isolating the affected system first.
- Do NOT communicate incident details externally without CTO authorisation.
- Do NOT pay ransoms without legal and CTO approval.
- Do NOT delete logs or evidence (potential legal hold).

## 8. Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| **CTO (Incident Commander)** | Lead response; BoN notification; communications |
| **Technical Lead** | Containment; forensics; system recovery |
| **Hotel Manager** | Guest communications; operational continuity |
| **All Staff** | Report suspected incidents immediately to CTO |

## 9. Related Documents

- [`../INCIDENT_RESPONSE_PLAN.md`](../INCIDENT_RESPONSE_PLAN.md) — full procedures with contact details
- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)
- [`LOGGING_AND_MONITORING_POLICY.md`](LOGGING_AND_MONITORING_POLICY.md)
- Code: `lib/services/compliance/SecurityIncidentService.ts`, `cybersecurity_incidents` table

## 10. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-02 | CTO | Initial policy; references IRP for procedures |

**Approved by:** _________________________ Date: _________

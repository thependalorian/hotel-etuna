# Business Continuity Policy

**Effective Date:** 2026-06-02  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** A1.1–A1.3  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Ensure Hotel Etuna can continue critical business operations during and after disruptions, and recover within defined time objectives.

## 2. Scope

All production systems supporting guest bookings, payments, and staff operations — including Vercel (application), Neon (database), Qdrant (AI), and Adumo (payments).

## 3. Recovery Objectives

| Metric | Target | System |
|--------|--------|--------|
| **RTO** — Recovery Time Objective | 4 hours | Booking + payment systems |
| **RPO** — Recovery Point Objective | 1 hour | Neon PITR backup |
| **Uptime target** | 99.5% | Per PSD-12 BoN requirement |

## 4. Critical Services (Priority Order)

| Priority | Service | Impact if down |
|----------|---------|----------------|
| 1 | Neon PostgreSQL | All data operations fail |
| 2 | Vercel application | Guest booking + staff dashboard inaccessible |
| 3 | Adumo payment gateway | Card payments unavailable (cash/NamQR fallback) |
| 4 | Qdrant vector DB | Sofia AI degraded; core ops unaffected |
| 5 | SMTP email | Automated notifications delayed |

## 5. Continuity Procedures

**Database failure:**
1. Neon PITR restore to last clean snapshot (see `docs/compliance/BACKUP_POLICY.md`).
2. Verify `npm run test:db` passes before traffic restore.
3. Estimated restore: 1–2 hours.

**Application failure:**
1. Rollback via Vercel dashboard to previous deployment.
2. Estimated rollback: 15 minutes.

**Payment gateway failure:**
1. Activate cash payment mode at front desk.
2. NamQR bank-app flow remains available as fallback.
3. Notify guests of card payment unavailability.

**Complete outage (all systems):**
1. Notify Incident Commander per `INCIDENT_RESPONSE_PLAN.md`.
2. Activate manual check-in process (paper-based).
3. Communicate estimated restore time to guests.

## 6. Testing

- **Semi-annual:** Neon branch restore test (documented in `compliance/evidence/bcp-tests/`).
- **Annual:** Full tabletop exercise simulating 4-hour outage.

**Last tabletop exercise:** Not yet conducted (target: Q3 2026).

## 7. Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| **CTO** | Activate BCP; coordinate technical recovery; communicate with BoN if PSD-12 threshold breached |
| **Hotel Manager** | Coordinate guest communication; activate manual processes |
| **Front Desk** | Execute manual check-in; collect cash payments; log incidents |

## 8. Related Documents

- [`BACKUP_POLICY.md`](BACKUP_POLICY.md)
- [`../BUSINESS_CONTINUITY_PLAN.md`](../BUSINESS_CONTINUITY_PLAN.md) — detailed procedures
- [`../INCIDENT_RESPONSE_PLAN.md`](../INCIDENT_RESPONSE_PLAN.md)
- [`VENDOR_MANAGEMENT_POLICY.md`](VENDOR_MANAGEMENT_POLICY.md)

## 9. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-02 | CTO | Initial policy |

**Approved by:** _________________________ Date: _________

# Business Continuity Plan (BCP)

**Effective Date:** May 16, 2026  
**Plan Owner:** CTO  
**Review Frequency:** Annual + after significant architecture change  
**TSC Reference:** CC7.1, CC7.5  
**Last tested:** [Schedule first drill — Week 7 SOC 2]

---

## 1. Purpose

Restore Hotel Etuna booking, payment, and staff operations within defined recovery objectives after disruption.

**Related:** [`INCIDENT_RESPONSE_PLAN.md`](INCIDENT_RESPONSE_PLAN.md) (security incidents).

---

## 2. Recovery objectives

| Metric | Target | Config |
|--------|--------|--------|
| **RTO** (Recovery Time Objective) | 4 hours for core booking/payment | `RTO_SECONDS` in `.env.example` |
| **RPO** (Recovery Point Objective) | 1 hour data loss max | Neon PITR; `RPO_SECONDS` |
| **Availability target** | 99.5% monthly (booking + payments) | PRD SLA |

---

## 3. Critical systems

| System | Function | Provider | Failover |
|--------|----------|----------|----------|
| Web app | Guest + staff UI | Vercel | Redeploy; DNS via Vercel |
| Database | PMS, folio, audit | Neon | PITR restore to new branch |
| Vector DB | Sofia RAG | Qdrant | Re-ingest from knowledge files |
| Card payments | Adumo Virtual | Adumo | Manual EFT + NamQR desk |
| Desk QR | NamQR | On-platform | Cash + manual folio |
| Auth | NextAuth | App | Session cache clears on restore |

---

## 4. Scenarios & playbooks

### 4.1 Vercel outage

1. Confirm status.vercel.com.
2. Communicate to staff via WhatsApp/SMS tree.
3. Take manual phone bookings; paper folio.
4. If prolonged (>4h), evaluate backup host deploy (runbook TBD).

### 4.2 Neon database failure

1. Open Neon console → restore from PITR to timestamp before incident.
2. Update `DATABASE_URL` in Vercel if connection string changes.
3. Run `scripts/db/verify-db.ts` and `verify-tenant-rls.ts`.
4. Replay missed webhooks from Adumo if any (idempotent handlers).

### 4.3 Adumo unavailable

1. Switch to NamQR desk + manual payment (`POST /api/payments/manual`).
2. Do not collect card numbers on property systems.
3. Notify Adumo support; log incident in `cybersecurity_incidents` if payment system impact.

### 4.4 Ransomware / compromise

Follow **Incident Response Plan** — do not restore from suspect backup without forensics.

### 4.5 Key person unavailable

Deputy Incident Commander assumes CTO duties per IRT roster in IRP.

---

## 5. Communication

| Audience | Channel | When |
|----------|---------|------|
| Staff | Phone tree + WhatsApp | Within 30 min of P1 |
| Guests (active stays) | Front desk + email | As needed |
| Buffr executive | Direct call | P1 within 1h |
| BoN | Per PSD-12 if payment system | IRP §5.2 |

---

## 6. Testing

| Test | Frequency | Evidence |
|------|-----------|----------|
| Tabletop (BCP + IRP) | Biannual | `docs/compliance/incidents/tabletop-YYYY-MM-DD.md` |
| Neon restore drill | Annual | Restore log in evidence folder |
| Adumo failover (manual pay) | Annual | Desk SOP sign-off |

---

## 7. Maintenance

- Update BCP when adding payment rails or regions.
- Review contact list quarterly (same as IRP).

---

## 8. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | CTO | Initial BCP |

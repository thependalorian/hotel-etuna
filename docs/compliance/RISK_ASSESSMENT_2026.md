# Risk assessment 2026 — Hotel Etuna

**Effective date:** 2026-06-10  
**Methodology:** NIST SP 800-30 lite  
**Owner:** CTO  
**TSC reference:** CC3.1–CC3.4  
**Next review:** 2026-12-10 (semi-annual) / annual board review

---

## 1. Purpose

Identify, score, and treat information-security risks for the Hotel Etuna platform ahead of SOC 2 Type II observation (Jun–Nov 2026).

---

## 2. Scope

In-scope: production PMS (Vercel), Neon PostgreSQL, payment rails (Adumo, NamQR), Sofia AI, hub + partner tenants, staff access.

Out-of-scope: Adumo PCI cardholder environment (inherited), property guest Wi‑Fi hardware, third-party physical security of cloud data centres.

---

## 3. Asset inventory (summary)

| Asset | Classification | Owner |
|-------|----------------|-------|
| Guest PII (bookings, folio, CRM) | Confidential | CTO |
| Payment session metadata | Restricted | CTO |
| `audit_trail` / compliance logs | Confidential | CTO |
| Source code + migrations | Internal | CTO |
| Vendor API keys | Restricted | CTO |
| Sofia conversation history | Confidential | CTO |

Full SaaS inventory: `compliance/evidence/assets/ASSET_INVENTORY_2026.csv`

---

## 4. Threat summary

| Threat | Likelihood (1–5) | Impact (1–5) | Inherent risk |
|--------|------------------|--------------|---------------|
| Credential theft / account takeover | 3 | 5 | **High** |
| Tenant isolation failure (partner sees hub data) | 2 | 5 | **High** |
| Payment fraud / duplicate capture | 3 | 4 | **High** |
| Ransomware / DB wipe | 2 | 5 | **High** |
| Vendor breach (Vercel/Neon/Adumo) | 2 | 4 | **Medium** |
| Insider PII exfiltration | 2 | 4 | **Medium** |
| LLM prompt injection / data leak to model vendor | 3 | 3 | **Medium** |
| Extended Vercel/Neon outage | 2 | 4 | **Medium** |
| Missing regulatory incident notice (PSD-12) | 2 | 4 | **Medium** |
| Dependency CVE (npm) | 4 | 3 | **Medium** |

---

## 5. Top 10 risks & treatment

| ID | Risk | Treatment | Owner | Target |
|----|------|-----------|-------|--------|
| R-01 | Unsigned policies at audit | Executive sign-off pack | CEO/CTO | 2026-06-21 |
| R-02 | Weak platform MFA | Enforce MFA Vercel/GitHub/Neon | CTO | 2026-06-14 |
| R-03 | Insufficient logging (pgAudit) | Enable pgAudit; monthly audit export | Dev | 2026-06-21 |
| R-04 | Vendor SOC gaps | Request attestations + CUEC | CTO | 2026-06-28 |
| R-05 | IR untested | Tabletop 15 Jun + results filed | CTO | 2026-06-15 |
| R-06 | Backup untested | Q2 Neon PITR restore drill | Dev | 2026-06-22 |
| R-07 | Retention non-compliance | Cron retention + Sofia 24mo purge | Dev | 2026-07-15 |
| R-08 | Access creep | Quarterly access review | CTO | 2026-06-30 |
| R-09 | Staff security awareness | Annual training log | HR/CTO | 2026-07-31 |
| R-10 | No external pentest | Engage CPA-aligned pentest | CTO | 2026-09-30 |

---

## 6. Residual risk acceptance

Residual risks accepted by Executive Sponsor until remediation completes are logged in `compliance/evidence/csf-profile/` and reviewed quarterly.

**Approved by:** _________________________ CEO/Owner  Date: _________  
**Prepared by:** _________________________ CTO  Date: _________

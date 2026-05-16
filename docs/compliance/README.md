# Compliance & Audit — Hotel Etuna

**Owner:** CTO  
**Status:** SOC 2 Implementation In Progress (Target: Type II Nov 2026)  
**Last Updated:** May 16, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [SOC 2 Implementation](#soc-2-implementation)
3. [Compliance Structure](#compliance-structure)
4. [Key Documents](#key-documents)
5. [Evidence Collection](#evidence-collection)
6. [Team & Contacts](#team--contacts)
7. [Quick Start](#quick-start)

---

## Overview

This folder contains all compliance documentation, policies, and evidence for Hotel Etuna's SOC 2 Type II certification and regulatory compliance (PSD-12, ETA, PSMA).

**Frameworks:**
- **SOC 2 Type II** — Trust Services Criteria (Security, Availability, Confidentiality)
- **Namibia regulatory** — NTB, NamRA VAT, FICA, ETA, tourism levy — see [`NAMIBIA_REGULATORY_FRAMEWORK.md`](NAMIBIA_REGULATORY_FRAMEWORK.md)
- **PSD-12** — BoN Operational & Cybersecurity Standards
- **ETA** — Electronic Transactions Act (Namibia)
- **PSMA** — Payment System Management Act

**Current Compliance Score:** ~45% baseline → Target 95%+ by audit (Week 25)

---

## SOC 2 Implementation

### Timeline Overview

| Phase | Weeks | Status | Deliverables |
|-------|-------|--------|--------------|
| **Preparation** | 1-2 | 🟡 In Progress | Scope, gap analysis, team formation |
| **Implementation** | 3-8 | ⏳ Pending | 21 policies, IRP, BCP, logging, vendor mgmt |
| **Evidence Collection** | 9-24 | ⏳ Pending | 6-month observation period |
| **Audit Engagement** | 25-28 | ⏳ Pending | Type II audit by CPA firm |

**Current Week:** 1 (Started May 16, 2026)  
**Target Audit Date:** November 2026

### Master Plan

**📄 Full Implementation Plan:** [`docs/project/SOC2_IMPLEMENTATION_PLAN.md`](../project/SOC2_IMPLEMENTATION_PLAN.md)

**🎯 Task Tracker:** [`docs/project/TASK.md`](../project/TASK.md) § SOC 2 Compliance Initiative

### Dashboard

**🖥️ Live Compliance Status:** https://hoteletuna.com/compliance/soc2 (hub admin only)

**API:** `GET /api/compliance/soc2?action=status|full-report|export` (hub tenant + admin role). Agent table UI uses alias `GET /api/compliance/soc2/audit?from=&to=`. Single orchestrator: `Soc2AuditOrchestrator`.

---

## Compliance Structure

```
docs/compliance/
├── README.md (this file)
├── NAMIBIA_REGULATORY_FRAMEWORK.md — master law ↔ product map (DONE ✅)
├── HOSPITALITY_AND_TOURISM_COMPLIANCE.md — NTB, levy, grading (DONE ✅)
├── TAX_AND_NAMRA_COMPLIANCE.md — dual VAT streams (DONE ✅)
├── DATA_PROTECTION_AND_PRIVACY_PROGRAM.md — POPIA readiness (DONE ✅)
├── CONTRACT_AND_COMMERCIAL_LAW_FRAMEWORK.md — ETA, guest/Buffr contracts (DONE ✅)
├── AML_FICA_COMPLIANCE_PROGRAM.md — FIC / STR (DONE ✅)
├── SECURITY_PROMPT_PACK.md — pointer to canonical pack (DONE ✅)
├── INCIDENT_RESPONSE_PLAN.md — CC7.3 (DONE ✅)
├── BUSINESS_CONTINUITY_PLAN.md — CC7.1 (DONE ✅)
├── VENDOR_RISK_ASSESSMENT_2026.md — CC9.1 (Week 8)
├── RISK_ASSESSMENT_2026.md — CC3.1 (Week 3)
│
├── policies/ — 21 security policies (Week 4)
│   ├── INFORMATION_SECURITY_POLICY.md — CC6.1 (DONE ✅)
│   ├── ACCESS_CONTROL_POLICY.md
│   ├── ACCEPTABLE_USE_POLICY.md
│   ├── CHANGE_MANAGEMENT_POLICY.md
│   ├── DATA_CLASSIFICATION_POLICY.md
│   ├── ... (16 more policies)
│   └── POLICY_TEMPLATE.md — blank template
│
├── evidence/ — Monthly exports for CPA auditor
│   ├── 2026-05/ — audit logs, user list, git commits, npm audit
│   ├── 2026-06/
│   ├── ... (6 months of evidence)
│   └── README.md — Evidence collection instructions
│
├── vendor-attestations/ — SOC 2 reports, PCI-DSS AOC
│   ├── Vercel_SOC2_2026.pdf (Week 8)
│   ├── Neon_SOC2_2026.pdf (Week 8)
│   ├── Adumo_PCI_2026.pdf (Week 8)
│   └── ... (other vendors)
│
├── incidents/ — Cybersecurity incident reports
│   ├── tabletop-YYYY-MM-DD.md — Exercise results (Week 5, biannual)
│   └── YYYY-MM-DD-incident-XXX.md — Real incident postmortems
│
├── log-reviews/ — Weekly log review notes
│   ├── 2026-05-20.md
│   ├── 2026-05-27.md
│   └── ... (weekly)
│
└── runbooks/ — Operational procedures
    ├── RESTORE_NEON_BACKUP.md
    ├── DEPLOY_TO_BACKUP_HOST.md
    └── ... (BCP procedures)
```

---

## Key Documents

### Security & Operational Documents

| Document | Purpose | Status | File |
|----------|---------|--------|------|
| **Security Prompt Pack** | AI-driven security review prompts for feature development | ✅ Complete | [`../SECURITY_PROMPT_PACK.md`](../SECURITY_PROMPT_PACK.md) |
| **Information Security Policy** | Overarching security posture | ✅ Complete | [`policies/INFORMATION_SECURITY_POLICY.md`](policies/INFORMATION_SECURITY_POLICY.md) |
| **Incident Response Plan** | Cybersecurity incident procedures | ✅ Complete | [`INCIDENT_RESPONSE_PLAN.md`](INCIDENT_RESPONSE_PLAN.md) |

### Policies (SOC 2 Required)

| Policy | TSC | Status | File |
|--------|-----|--------|------|
| **Business Continuity Plan** | CC7.1 | ✅ Complete | `BUSINESS_CONTINUITY_PLAN.md` |
| **Access Control Policy** | CC6.1 | ✅ Complete | `policies/ACCESS_CONTROL_POLICY.md` |
| **Change Management Policy** | CC8.1 | ✅ Complete | `policies/CHANGE_MANAGEMENT_POLICY.md` |
| **Data Protection Policy** | CC6.7 | ✅ Complete | `policies/DATA_PROTECTION_POLICY_NAMIBIA.md` (canonical; `DATA_PROTECTION_POLICY.md` = pointer) |
| **Data Retention Policy** | CC6.5 | ✅ Complete | `policies/DATA_RETENTION_POLICY.md` |
| **Acceptable Use Policy** | CC2.1 | ✅ Complete | `policies/ACCEPTABLE_USE_POLICY.md` |
| **Vendor Management Policy** | CC9.1 | ⏳ Week 4 | `policies/VENDOR_MANAGEMENT_POLICY.md` |
| **Data Classification Policy** | CC6.7 | ⏳ Week 4 | `policies/DATA_CLASSIFICATION_POLICY.md` |
| **... (11 more policies)** | Various | ⏳ Week 4 | See [policy list](#security-policies-21-required) |

### Technical Implementation

| Control | Implementation | Evidence Location |
|---------|---------------|-------------------|
| **Access Control** | RLS policies, `proxy.ts`, NextAuth | [`lib/db/schema.ts`](../../lib/db/schema.ts), [`proxy.ts`](../../proxy.ts) |
| **Audit Logging** | `audit_trail` table, `recordAudit()` | [`lib/compliance/record-audit.ts`](../../lib/compliance/record-audit.ts) |
| **Incident Tracking** | `cybersecurity_incidents` table | [`lib/db/schema.ts`](../../lib/db/schema.ts) |
| **Change Management** | Git commits, Drizzle migrations | [`database/drizzle/*.sql`](../../database/drizzle/) |
| **Monitoring** | Vercel logs, Neon pgAudit | Vercel dashboard, Neon console |
| **Encryption** | TLS 1.3 (Vercel), AES-256 (Neon) | Inherited controls (vendor attestations) |
| **Session Management** | 30min idle, 8h absolute timeout | [`components/SessionTimeoutWrapper.tsx`](../../components/SessionTimeoutWrapper.tsx) |
| **MFA** | 2FA on payment endpoints | [`lib/compliance/with-admin-rate-limit.ts`](../../lib/compliance/with-admin-rate-limit.ts) |

### Regulatory Alignment

| Regulation | Requirement | Hotel Etuna Implementation |
|------------|-------------|----------------------------|
| **PSD-12** | 72-hour incident reporting to BoN | Incident Response Plan § 5.2 |
| **PSD-12** | Cybersecurity incident tracking | `cybersecurity_incidents` table |
| **ETA** | Electronic record-keeping | `audit_trail` table (immutable) |
| **PSMA** | Payment system compliance | Adumo PCI-DSS attestation (inherited) |

---

## Evidence Collection

### Monthly Evidence Exports

**Owner:** Technical Lead  
**Schedule:** Last business day of each month  
**Time Allocation:** 4 hours/month

**Checklist:**
- [ ] Export user list (active, inactive, MFA status)
- [ ] Export `audit_trail` table (last 30 days)
- [ ] Export Vercel function logs (screenshots or CSV)
- [ ] Export Git commits (with author, PR link)
- [ ] Run `npm audit` and save report
- [ ] Update risk register
- [ ] Document any security incidents (even if none)
- [ ] Upload all to `evidence/YYYY-MM/`

**Automated Option:** Vanta (N$30K-40K/year) auto-imports GitHub, Vercel, Google Workspace

**Manual Template:** `evidence/README.md` (instructions + CSV templates)

---

## Security Policies (21 Required)

| # | Policy | TSC | Status |
|---|--------|-----|--------|
| 1 | Information Security Policy | CC6.1 | ✅ Complete |
| 2 | Access Control Policy | CC6.1 | ✅ Complete |
| 3 | Acceptable Use Policy | CC2.1 | ✅ Complete |
| 4 | Incident Response Policy | CC7.3 | ✅ Complete (IRP) |
| 5 | Change Management Policy | CC8.1 | ✅ Complete |
| 6 | Business Continuity Policy | CC7.1 | ✅ Complete (BCP) |
| 7 | Data Classification Policy | CC6.7 | ⏳ Week 4 |
| 8 | Data Retention Policy | CC6.5 | ✅ Complete |
| 9 | Vendor Management Policy | CC9.1 | ⏳ Week 4 |
| 10 | Asset Management Policy | CC6.2 | ⏳ Week 4 |
| 11 | Cryptography Policy | CC6.7 | ⏳ Week 4 |
| 12 | Password Policy | CC6.1 | ⏳ Week 4 |
| 13 | Remote Access Policy | CC6.6 | ⏳ Week 4 |
| 14 | Physical Security Policy | CC6.4 | ⏳ Week 4 |
| 15 | Network Security Policy | CC6.6 | ⏳ Week 4 |
| 16 | Logging & Monitoring Policy | CC7.2 | ⏳ Week 4 |
| 17 | Backup Policy | CC7.1 | ⏳ Week 4 |
| 18 | Data Protection Policy | CC6.7 | ✅ Complete |
| 19 | HR Security Policy | CC2.1 | ⏳ Week 4 |
| 20 | Training Policy | CC2.2 | ⏳ Week 4 |
| 21 | Code of Conduct | CC2.1 | ⏳ Week 4 |

**Template:** Use `policies/POLICY_TEMPLATE.md` for consistency

**Approval:** Executive Sponsor (CEO/Owner) must sign all policies

---

## Team & Contacts

### Incident Response Team (IRT)

| Role | Name | Contact | Responsibilities |
|------|------|---------|-----------------|
| **Incident Commander** | [CTO Name] | [Phone], [Email] | Overall leadership; BoN notification |
| **Technical Lead** | [Senior Developer] | [Phone], [Email] | Investigation; containment; forensics |
| **Communications Lead** | [Operations Manager] | [Phone], [Email] | Internal/external comms; PR |
| **Legal Liaison** | [External Counsel] | [Phone], [Email] | Regulatory guidance; breach notification |

### SOC 2 Program Team

| Role | Owner | Time Allocation |
|------|-------|----------------|
| **Program Lead** | CTO | 80 hours over 28 weeks |
| **Technical Lead** | Senior Developer | 120 hours over 28 weeks |
| **Compliance Liaison** | Operations Manager | 60 hours over 28 weeks |
| **Executive Sponsor** | CEO/Owner | 20 hours (reviews only) |

### Vendor Support (Critical)

| Vendor | Service | Support Contact | Escalation |
|--------|---------|----------------|------------|
| **Vercel** | Hosting | support@vercel.com | [Emergency phone] |
| **Neon** | Database | support@neon.tech | [Emergency phone] |
| **Adumo** | Payments | support@adumo.com | [Emergency phone] |
| **Bank of Namibia** | Regulator | [PSD-12 contact] | [Cybersecurity Unit] |

---

## Quick Start

### For New Team Members

1. **Read these documents in order:**
   - [ ] This README (you are here!)
   - [ ] `../project/SOC2_IMPLEMENTATION_PLAN.md` — Full roadmap
   - [ ] `INFORMATION_SECURITY_POLICY.md` — Overarching security posture
   - [ ] `INCIDENT_RESPONSE_PLAN.md` — What to do in a breach
   - [ ] [`../SECURITY_PROMPT_PACK.md`](../SECURITY_PROMPT_PACK.md) — Security review prompts for development

2. **Sign policy acknowledgment forms** (HR will provide)

3. **Complete security awareness training** (annual requirement)

4. **Set up access:**
   - [ ] GitHub account (code reviews, evidence)
   - [ ] Vercel dashboard (logs, deployments)
   - [ ] Neon console (database, backups)
   - [ ] 1Password team vault (secrets)
   - [ ] Compliance Slack channel (if applicable)

### For Developers

**Security Review Process:**
1. **After building any feature:** Run "The Master Security Review" from [`../SECURITY_PROMPT_PACK.md`](../SECURITY_PROMPT_PACK.md) § 14
2. **Before deploying to production:** Run `npm run security:preflight` and § 15 in [`../SECURITY_PROMPT_PACK.md`](../SECURITY_PROMPT_PACK.md)
3. **For specific security concerns:** Use relevant section prompts (e.g., § 1 for validation, § 4 for permissions)

**Key Resources:**
- [ ] Security Prompt Pack: [`../SECURITY_PROMPT_PACK.md`](../SECURITY_PROMPT_PACK.md) — 15 AI-driven security review prompts
- [ ] Coding Standards: `../../.cursor/rules/code-and-docs.mdc` — DRY, Boy Scout Rule
- [ ] System Design Guide: See user rules (23 rules for scalable code)

### For Incident Commander (CTO)

**Emergency Contacts Checklist:**
- [ ] Print incident response team contact list
- [ ] Save BoN Cybersecurity Unit contact in phone
- [ ] Save external counsel contact (24/7 emergency line)
- [ ] Save vendor emergency escalation numbers
- [ ] Keep `INCIDENT_RESPONSE_PLAN.md` handy (bookmark or print)

**Monthly Tasks:**
- [ ] Review evidence collection (last business day of month)
- [ ] Run weekly log reviews (document in `log-reviews/`)
- [ ] Update risk register (quarterly)
- [ ] Check for vendor attestation renewals (annual)

### For CPA Auditor (Week 25+)

**Evidence Portal:**
1. **Access:** Hub admin login → `/compliance/soc2`
2. **Export:** Click "Export Evidence for CPA" (JSON download)
3. **Files:** All evidence in `docs/compliance/evidence/YYYY-MM/`

**Key Evidence Locations:**
- **Access Control:** RLS verification script (`scripts/db/verify-tenant-rls.ts`)
- **Audit Logs:** `audit_trail` table + Vercel logs (7-day retention)
- **Change Management:** GitHub commit history + `database/drizzle/*.sql`
- **Incident Response:** `cybersecurity_incidents` table + tabletop exercise notes
- **Vendor Attestations:** `vendor-attestations/*.pdf`

**Interview Schedule:** Coordinate with Program Lead (CTO)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | CTO | Initial compliance framework for SOC 2 Type II |
| 1.1 | May 16, 2026 | CTO | Namibia regulatory pack + 6 additional SOC 2 policies/BCP |

**Next Review:** After Week 8 implementation phase complete

---

## References

- **AICPA Trust Services Criteria:** https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/trustdataintegritytaskforce
- **Bank of Namibia PSD-12:** [Insert BoN link when available]
- **Namibia ETA 2019:** https://namiblii.org/akn/na/act/2019/4
- **SOC 2 Readiness Checklist:** https://www.vanta.com/resources/soc-2-checklist

---

**Questions?** Contact Program Lead (CTO) or see [`../project/SOC2_IMPLEMENTATION_PLAN.md`](../project/SOC2_IMPLEMENTATION_PLAN.md)

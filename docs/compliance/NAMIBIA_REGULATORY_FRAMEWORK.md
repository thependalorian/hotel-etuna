# Namibia Regulatory Framework — Hotel Etuna & Buffr

**Effective Date:** May 16, 2026  
**Document Owner:** CTO / Compliance Liaison  
**Review Frequency:** Quarterly (or when BoN/NamRA/NTB guidance changes)  
**Status:** Engineering & operations index — **not legal advice**

---

## 1. Purpose

This document maps **Namibian law and regulatory determinations** to Hotel Etuna product controls, policies, and evidence. It complements:

- SOC 2 program: [`docs/project/SOC2_IMPLEMENTATION_PLAN.md`](../project/SOC2_IMPLEMENTATION_PLAN.md)
- Commercial terms (Buffr ↔ Etuna): handled with counsel out-of-band; technical canon in `docs/project/PLANNING.md` § Payment strategy
- Engineering index: [`lib/compliance/regulatory-context.ts`](../../lib/compliance/regulatory-context.ts)
- Security reviews: [`docs/SECURITY_PROMPT_PACK.md`](../SECURITY_PROMPT_PACK.md)

**Counsel must confirm** licensing boundaries (Buffr as platform vs Etuna as accommodation supplier), tax positions, and whether Buffr activities require BoN authorisation under PSD-1.

---

## 2. Legal entities in scope

| Entity | Role | Key identifiers (from product config) |
|--------|------|--------------------------------------|
| **Etuna Guesthouse And Tours CC** | Accommodation supplier; guest VAT; NamQR payee | CC/2011/3890 · VAT 05517026-015 · Nedbank 11000481744 |
| **Buffr Financial Services CC** | Platform operator; B2B fees; card processing facilitator | CC/2024/09322 · VAT 0031148015 · Bank Windhoek |

Code: `lib/platform/namibia-tax.ts`, `lib/platform/settlement-accounts.ts`.

---

## 3. Framework matrix

| Domain | Primary law / instrument | Regulator | Hotel Etuna doc | Product / evidence |
|--------|-------------------------|-----------|-----------------|-------------------|
| **Tourism accommodation** | Namibia Tourism Board Act 21 of 2000; Registration Regulations GN 139/2004; Levy GN 137/2004; Star Grading GN 204/2012 | Namibia Tourism Board (NTB) | [`HOSPITALITY_AND_TOURISM_COMPLIANCE.md`](HOSPITALITY_AND_TOURISM_COMPLIANCE.md) | Registration cert on file; levy returns |
| **VAT & income tax** | Value-Added Tax Act 10 of 2000; Income Tax Act | NamRA | [`TAX_AND_NAMRA_COMPLIANCE.md`](TAX_AND_NAMRA_COMPLIANCE.md) | `lib/platform/namibia-tax.ts`, `PropertyVatService`, `/reports/property-vat` |
| **Electronic commerce** | Electronic Transactions Act 4 of 2019 | MIT / courts | [`CONTRACT_AND_COMMERCIAL_LAW_FRAMEWORK.md`](CONTRACT_AND_COMMERCIAL_LAW_FRAMEWORK.md) | `app/legal/*`, `audit_trail`, `consumer_rights_requests` |
| **Contracts & companies** | Common law contract; Companies Act 28 of 2004 | Courts / BIPA | [`CONTRACT_AND_COMMERCIAL_LAW_FRAMEWORK.md`](CONTRACT_AND_COMMERCIAL_LAW_FRAMEWORK.md) | Buffr SLA, guest Terms |
| **Data protection** | Draft Data Protection Bill (2021/2022, not yet enacted); Constitution Art. 13 | Pending supervisory authority | [`DATA_PROTECTION_AND_PRIVACY_PROGRAM.md`](DATA_PROTECTION_AND_PRIVACY_PROGRAM.md) | `app/legal/privacy`, CRM consent API |
| **Payments — NPS** | Payment System Management Act 14 of 2023 | Bank of Namibia | This doc §4 | Payment rails, reconciliation |
| **Payments — licensing** | PSD-1 (PSP licensing, 2026 determination) | BoN | Buffr SLA § licensing | Adumo hosted virtual only |
| **Payments — e-money** | PSD-3 | BoN | Buffr SLA | No guest wallet in v1 |
| **Payments — cybersecurity** | PSD-12 | BoN | [`INCIDENT_RESPONSE_PLAN.md`](INCIDENT_RESPONSE_PLAN.md) | `cybersecurity_incidents`, 72h reporting |
| **Payments — QR** | Namibia QR Code Standards v5.0 (BoN May 2025) | BoN | `lib/compliance/namqr/*` | NamQR desk APIs |
| **Open banking** | Namibia Open Banking Standards | BoN | PRD § payments P2 | `ob_*` schema; PIS planned |
| **AML/CFT** | Financial Intelligence Act 13 of 2012 (+ regs) | FIC / NAMFISA (sector) | [`AML_FICA_COMPLIANCE_PROGRAM.md`](AML_FICA_COMPLIANCE_PROGRAM.md) | `aml_*` tables, STR APIs |
| **Consumer protection** | National Consumer Protection Policy 2020–2025; Consumer Protection Bill 2024 (pending) | MIT / future CPA | Guest Terms, support SLA | `consumer_rights_requests` |
| **Labour** | Labour Act 11 of 2007 | Ministry of Labour | HR policies (SOC 2 pack) | Staff records |
| **Information security (voluntary)** | SOC 2 TSC | AICPA / CPA auditor | [`README.md`](README.md) | `/compliance/soc2` |

**Authoritative sources (public):** [NamibLII](https://namiblii.org), [NamRA](https://www.namra.org.na), [NTB](https://www.namibiatourism.com.na), [FIC](https://www.fic.na), [BoN](https://www.bon.com.na).

**Engineering corpus (full text, repo):** `mba-agent/documents/mba-agent/regulatory/namibia/` — indexed in **PRD Appendix F** (May 2026).

---

## 4. Payment system stack (Buffr + Etuna)

```
Guest card pay ──► Adumo Virtual (hosted) ──► acquirer ──► settlement
Guest desk QR  ──► NamQR v5 (NRTC tag 17) ──► manual EFT confirm ──► folio
Platform fees  ──► Buffr invoice (B2B VAT) ──► Bank Windhoek
```

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| No PAN on origin | PCI SAQ-A | Adumo redirect only |
| NamQR standard | BoN v5.0 EMVCo tags | `encodeNamQrPayloadV5`, MCC 7011 |
| Incident reporting | PSD-12 (72h material incidents) | IRP §5.2; `BonIncidentReportingService` |
| Audit trail | ETA electronic records | `audit_trail` + `recordAudit()` |
| 2FA on sensitive pay ops | PSD-12 operational standards | Payment security API; admin rate limits |

---

## 5. Policy & document inventory

### Namibia-specific (this folder)

| Document | Status |
|----------|--------|
| `NAMIBIA_REGULATORY_FRAMEWORK.md` | ✅ This file |
| `HOSPITALITY_AND_TOURISM_COMPLIANCE.md` | ✅ |
| `TAX_AND_NAMRA_COMPLIANCE.md` | ✅ |
| `DATA_PROTECTION_AND_PRIVACY_PROGRAM.md` | ✅ |
| `CONTRACT_AND_COMMERCIAL_LAW_FRAMEWORK.md` | ✅ |
| `AML_FICA_COMPLIANCE_PROGRAM.md` | ✅ |

### SOC 2 / security (existing + in progress)

| Document | Status |
|----------|--------|
| `INCIDENT_RESPONSE_PLAN.md` | ✅ |
| `BUSINESS_CONTINUITY_PLAN.md` | ✅ |
| `policies/INFORMATION_SECURITY_POLICY.md` | ✅ |
| `policies/ACCESS_CONTROL_POLICY.md` | ✅ |
| `policies/DATA_PROTECTION_POLICY_NAMIBIA.md` | ✅ (canonical) |
| `policies/DATA_RETENTION_POLICY.md` | ✅ |
| `policies/ACCEPTABLE_USE_POLICY.md` | ✅ |
| `policies/CHANGE_MANAGEMENT_POLICY.md` | ✅ |
| `policies/DATA_CLASSIFICATION_POLICY.md` | ✅ |
| `policies/VENDOR_MANAGEMENT_POLICY.md` | ✅ |
| `policies/ASSET_MANAGEMENT_POLICY.md` | ✅ |
| `policies/CRYPTOGRAPHY_POLICY.md` | ✅ |
| `policies/PASSWORD_POLICY.md` | ✅ |
| `policies/REMOTE_ACCESS_POLICY.md` | ✅ |
| `policies/PHYSICAL_SECURITY_POLICY.md` | ✅ |
| `policies/NETWORK_SECURITY_POLICY.md` | ✅ |
| `policies/LOGGING_AND_MONITORING_POLICY.md` | ✅ |
| `policies/BACKUP_POLICY.md` | ✅ |
| `policies/HR_SECURITY_POLICY.md` | ✅ |
| `policies/TRAINING_POLICY.md` | ✅ |
| `policies/CODE_OF_CONDUCT.md` | ✅ |
| `policies/POLICY_TEMPLATE.md` | ✅ |
| Executive sign-off (all 21) | ⏳ Collect in `compliance/evidence/policies/` |

### Public-facing legal

| Page | Path |
|------|------|
| Privacy | `app/legal/privacy/page.tsx` |
| Terms | `app/legal/terms/page.tsx` |
| Cookies | `app/legal/cookies/page.tsx` |
| Security | `app/legal/security/page.tsx` |

---

## 6. Gap register (priority)

| ID | Gap | Owner | Target |
|----|-----|-------|--------|
| G-01 | POPIA-style DSAR portal & DPIA | CTO + counsel | Q3 2026 |
| G-02 | NamRA e-invoicing (Apr 2026 budget target) | Finance + eng | Before NamRA mandate |
| G-03 | Open banking PIS (pay-from-bank on QR) | Eng | PRD P2 |
| G-04 | Live BoN incident API (not simulation) | CTO | When BoN publishes |
| G-05 | FIC STR filing workflow (not only internal STR table) | Compliance | Q2 2026 |
| G-06 | Cookie consent banner (ETA/GDPR-aligned) | Product | Q2 2026 |
| G-07 | Immigration guest register (if required for foreign guests) | Operations | Counsel confirm |
| G-08 | Executive sign-off on 21 SOC 2 policies (drafts complete May 17) | CEO + CTO | Week 4–8 |
| G-09 | Vendor SOC 2 / PCI attestations in `vendor-attestations/` | CTO | Week 8 |

---

## 7. Security prompt pack execution

After any regulatory-facing feature change:

```bash
cd hotel-etuna && npm run security:preflight
```

Run **§14 Master Security Review** and **§15 Deployment Pre-Flight** from [`docs/SECURITY_PROMPT_PACK.md`](../SECURITY_PROMPT_PACK.md). Evidence: `compliance/evidence/security/preflight-YYYY-MM-DD.json`.

**Last preflight:** May 17, 2026 — 12/12 pass, 0 critical npm audit (`compliance/evidence/security/preflight-2026-05-17.json`).

---

## 8. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | CTO | Initial Namibia framework index |
| 1.1 | May 17, 2026 | Product / compliance | PRD §3.7 cross-ref; BoN mba-agent corpus index; fraud unified (`tenant-fraud-rules` + 0016 on initiate) |
| 1.2 | May 17, 2026 | Engineering | Preflight 12/12; fail-closed fraud gate in production |
| 1.3 | May 17, 2026 | CTO | 13 remaining SOC 2 policies published under `policies/` |

**Next review:** August 2026 (post NamRA e-invoicing guidance)

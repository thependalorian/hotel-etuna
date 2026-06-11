# CPA RFP — SOC 2 Type II (Hotel Etuna)

**Issue date:** 2026-06-10  
**Responses due:** 2026-08-01  
**Target fieldwork:** November 2026  
**Contact:** CTO, Buffr Financial Services CC

---

## Engagement scope

| Item | Detail |
|------|--------|
| Report type | SOC 2 **Type II** |
| Trust Services Criteria | Security, Availability, Confidentiality |
| System | Hotel Etuna PMS — `docs/project/SOC2_IMPLEMENTATION_PLAN.md` §2 |
| Observation period | June 2026 – November 2026 (minimum 6 months) |
| Subservice carve-outs | Vercel, Neon, Adumo (PCI) — CUECs in `compliance/evidence/vendor-attestations/CUEC_WORKSHEET.md` |

---

## Deliverables requested

1. **Type I readiness assessment** (August 2026) — gap report against our control matrix
2. **Type II audit** (November 2026) — unqualified opinion target
3. **Management letter** — remediation priorities if any
4. **Bridge letter** support for enterprise hospitality procurement

---

## Vendor qualifications

- AICPA peer-reviewed firm with hospitality or fintech SOC 2 experience
- Namibia / SADC regulatory familiarity (PSD-12, Data Protection Bill) preferred
- Fixed-fee proposal in NAD and USD

---

## Evidence we provide

- Repo-native monthly packs: `compliance/evidence/YYYY-MM/`
- Policies: `docs/compliance/policies/` (signed PDFs)
- Automated readiness: `npx tsx scripts/soc2/collect-evidence.ts`
- Dashboard: `/compliance/soc2` (internal)

---

## Timeline

| Milestone | Date |
|-----------|------|
| RFP responses | 2026-08-01 |
| CPA selection | 2026-08-15 |
| Type I readiness | 2026-08-31 |
| Pentest complete | 2026-09-30 |
| Type II fieldwork kickoff | 2026-11-01 |

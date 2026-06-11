# Type I readiness checklist — August 2026

Use with CPA gap report. All items should be **Pass** before Type II fieldwork.

| # | Control area | Evidence | Status |
|---|--------------|----------|--------|
| 1 | 22 signed policies | `compliance/evidence/policies/*-signed.pdf` | ☐ |
| 2 | Risk assessment | `docs/compliance/RISK_ASSESSMENT_2026.md` | ✅ |
| 3 | Vendor assessments + CUEC | `VENDOR_RISK_ASSESSMENT_2026.md`, `CUEC_WORKSHEET.md` | ✅ |
| 4 | Vendor SOC/PCI on file | `vendor-attestations/received/` | ☐ pending |
| 5 | Platform MFA | `PLATFORM_MFA_CHECKLIST.md` + screenshots | ☐ |
| 6 | pgAudit enabled | `pgaudit-status.json` in monthly pack | ☐ — see `OPERATOR_GATES_RUNBOOK.md` IMP-01 |
| 7 | Branch protection | `.github/BRANCH_PROTECTION_SETUP.md` | ☐ — operator applies on `main` |
| 7b | Policy runtime validation | `npm run validate:soc2` + matrix v2 | ✅ scripts + CI workflow |
| 7c | Sofia full-stack validation | `sofia_fullstack_validation_2026-06-10.md` | ✅ |
| 7d | DRY / dead-code cleanup | `TASK.md` § DRY cleanup 2026-06-10; `tsc` + `build` green | ✅ |
| 8 | Monthly evidence packs | `compliance/evidence/2026-MM/` | ✅ Jun/May |
| 9 | IR tabletop | `incidents/tabletop-2026-06-15-results.md` | ✅ |
| 10 | Restore drill | `backup-drills/restore-test-2026-06-10.md` | ✅ |
| 11 | Training log | `hr/SECURITY_TRAINING_LOG_2026.md` | ✅ |
| 12 | Access review Q2 | `access-review-*.json` | ✅ |
| 13 | Automated score ≥90% | `soc2_audit_*.json` | ☐ target Oct |
| 14 | Pentest report | `security/pentest-2026-09.pdf` | ☐ Sep |

**GRC decision gate (Aug 2026):** Evaluate Vanta vs Drata if manual packs exceed 4h/month.

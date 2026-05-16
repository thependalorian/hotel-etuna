# AML / FICA Compliance Program

**Effective Date:** May 16, 2026  
**Document Owner:** Compliance Liaison  
**MLRO / FIC contact:** [Assign]  
**Review Frequency:** Annual  
**Status:** Program outline — **not legal advice**

---

## 1. Purpose

Outline anti-money laundering and counter-terrorist financing controls for Hotel Etuna and Buffr, aligned with the **Financial Intelligence Act 13 of 2012** (FICA) and FIC guidance.

**Law:** [FICA on NamibLII](https://namiblii.org/akn/na/act/2012/13/eng@2023-07-21) · [FIC legal framework](https://www.fic.na/index.php?page=aml-cft-legal-framework)

**Product:** `aml_*` schema, `app/api/compliance/aml/*`, `PEPScreeningService`, `STRGenerationService`.

---

## 2. Institutional classification

| Entity | Likely role | Action |
|--------|-------------|--------|
| **Etuna Guesthouse And Tours CC** | May be **accountable institution** if conducting listed activities (e.g. certain cash transactions) — **counsel + FIC Schedule 1** | Confirm registration with FIC if required |
| **Buffr Financial Services CC** | Higher scrutiny if payment services / trust activities — **PSD-1 counsel** | Separate AML program for platform |

**Hospitality alone** does not automatically exempt cash-heavy businesses from FIC obligations — assess cash desk, FX, and high-value prepayments.

---

## 3. Risk-based approach

| Risk factor | Mitigation |
|-------------|------------|
| Large cash folio settlements | Cash reconciliation module; dual control |
| PEP guests | `PEPScreeningService`, manual approval |
| Foreign high-risk jurisdictions | Geo rules in `AMLMonitoringService` |
| Structuring / velocity | Velocity alerts table |
| Partner payouts (future) | Enhanced DD before release |

Document risk assessment annually → `docs/compliance/RISK_ASSESSMENT_2026.md` (Week 3 SOC 2 task).

---

## 4. Customer due diligence (CDD)

| Level | When | Steps |
|-------|------|-------|
| **Standard** | All corporate partners / high-value accounts | ID, beneficial owner, purpose |
| **Enhanced (EDD)** | PEP, high-risk country, unusual pattern | Manager approval + senior review |
| **Simplified** | Low-value retail guest (if permitted) | Per counsel — do not assume |

**KYC/KYB product:** `compliance_verification_cases`, LangGraph `kycKybGraph`, dashboard `/compliance/kyc`.

---

## 5. Suspicious transaction reports (STR)

| Step | Owner | System |
|------|-------|--------|
| Staff detects unusual activity | Front desk / finance | Internal alert |
| MLRO review | Compliance | `aml_alerts` |
| STR filed with FIC | MLRO | **Gap G-05:** confirm FIC goAML or prescribed channel |
| Record retention | Compliance | 5+ years |

Internal STR generation: `STRGenerationService` — must be wired to **actual FIC submission** with counsel.

---

## 6. Cash reporting

FICA requires reporting **large cash transactions** above FIC-prescribed thresholds — finance must monitor:

- Desk cash payments (`ManualPaymentService`, cash reconciliation)
- Aggregated guest cash per day

**Do not rely solely on software alerts** without MLRO sign-off.

---

## 7. Training

| Audience | Content | Frequency |
|----------|---------|-----------|
| Front desk | Cash red flags, ID verification | Annual |
| Finance | STR triggers, reconciliation | Annual |
| Developers | No bypass of payment limits | Onboarding |

---

## 8. Sanctions & PEP screening

- Screen partners at onboarding (`PEPScreeningService`).
- Re-screen on material change or annually.
- Document false positive handling.

---

## 9. Relation to BoN / PSD

Payment system operators have **additional** BoN reporting (PSD-12). AML (FIC) and prudential (BoN) reports are **separate** — IRP covers cyber; this program covers ML/TF.

---

## 10. Evidence checklist

- [ ] FIC registration letter (if accountable institution)
- [ ] MLRO appointment letter
- [ ] Annual AML risk assessment
- [ ] STR register (even if nil reports)
- [ ] Training attendance records
- [ ] Sample KYC case file from `compliance_verification_cases`

---

## 11. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | Compliance | Initial AML/FICA program |

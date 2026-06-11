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

**Product:** `aml_*` schema, `app/api/compliance/aml/*`, `STRGenerationService`, `AMLMonitoringService`.

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
| PEP guests | **Out of product scope** — no PEP database for Namibia; staff/MLRO apply judgment if a guest is known PEP |
| Foreign high-risk jurisdictions | Geo rules in `AMLMonitoringService` |
| Structuring / velocity | Velocity alerts table |
| Partner payouts (future) | Enhanced DD before release |

Document risk assessment annually → `docs/compliance/RISK_ASSESSMENT_2026.md` (Week 3 SOC 2 task).

---

## 4. Customer due diligence (CDD)

| Level | When | Steps |
|-------|------|-------|
| **Standard** | All corporate partners / high-value accounts | ID, beneficial owner, purpose |
| **Enhanced (EDD)** | Known PEP (staff-identified), high-risk country, unusual pattern | Manager approval + senior review |
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

**Product decision (June 2026): PEP screening is not in scope for Hotel Etuna.**

| Rationale | Detail |
|-----------|--------|
| Market size | Namibia’s population and public-official footprint are small; hospitality guests are overwhelmingly domestic or regional travellers. |
| Data availability | There is **no reliable, maintained domestic PEP database** suitable for automated screening in-product (no FIC-published list, no affordable local provider integrated). |
| Risk proportionality | Cash reconciliation, velocity alerts, STR workflow, and KYC/KYB cover the material AML risks for a single-property OS. |

**What we do instead**

- **Sanctions / adverse media:** Defer to counsel and manual checks at onboarding for **partners** and high-value corporate accounts — not automated in the app today.
- **PEP:** If front desk or management **knows** a guest is politically exposed, treat as **enhanced due diligence** (§4) and document in the STR/KYC case file. No automated screen, no in-app PEP registry.
- **Schema note:** `aml_pep_database` and `aml_guest_pep_flags` exist from an earlier Buffr port — **dormant**, not populated, not exposed in UI or API. Do not build PEP screening unless counsel mandates a **third-party data provider** with a Namibia-appropriate source.

Re-screen partners on material change or annually when a sanctions provider is engaged; document false positive handling in the MLRO register.

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
| 1.1 | June 9, 2026 | Compliance | PEP screening out of product scope — no Namibia PEP database; dormant `aml_pep_*` schema |

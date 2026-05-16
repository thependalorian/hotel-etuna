# Tax & NamRA Compliance — Dual VAT Streams

**Effective Date:** May 16, 2026  
**Document Owner:** Finance / CTO  
**Review Frequency:** Quarterly  
**Status:** Operational guide — **not tax advice**

---

## 1. Purpose

Hotel Etuna and Buffr operate **two independent VAT streams** under Namibian law. This document explains obligations, product behaviour, and evidence — counsel and a registered tax practitioner must sign off on returns and registration details.

**Law:** Value-Added Tax Act 10 of 2000 ([NamibLII](https://namiblii.org/akn/na/act/2000/10)).

**Code:** `lib/platform/namibia-tax.ts`, `lib/services/tax/PropertyVatService.ts`.

**Commercial terms:** [`docs/BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md`](../BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md) §4.5, §8.7.

---

## 2. Registration thresholds

| Threshold | Amount (NAD) | Action |
|-----------|--------------|--------|
| Compulsory VAT registration | > **500,000** taxable supplies / 12 months | Must register with NamRA |
| Voluntary registration | **200,000 – 500,000** | May register if fixed place of business + proper records |

Both entities document VAT numbers in `namibia-tax.ts` — **verify against current NamRA certificates** before issuing tax invoices.

---

## 3. Stream A — Hotel Etuna (guest hospitality)

| Field | Documented value |
|-------|------------------|
| Legal name | Etuna Guesthouse And Tours CC |
| Trade name | Hotel Etuna |
| CC | CC/2011/3890 |
| VAT ref | 05517026-015 |
| Standard rate | **15%** |
| Prices | VAT-inclusive by default (`HOTEL_ETUNA_PRICES_VAT_INCLUSIVE`) |

### 3.1 Product behaviour

- Folio lines: `FolioService` + `computeHospitalityVatBreakdown()`
- Guest-facing breakdown: `FolioVatBreakdown.tsx`
- Period reports: `GET /api/reports/property-vat`, `PropertyVatReportPanel`
- Tax invoice checklist: `PROPERTY_GUEST_TAX_INVOICE_CHECKLIST` in `namibia-tax.ts`

### 3.2 Operational tasks

| Task | Frequency | Owner |
|------|-----------|-------|
| Issue tax invoices for taxable supplies | Per charge / checkout | Front desk / system |
| File VAT return (NamRA) | Per NamRA cycle | Accountant |
| Reconcile folio VAT to return | Monthly | Finance |
| Renew tax good standing | Before expiry | Finance |
| Update env vars if VAT number changes | As needed | CTO |

### 3.3 Entertainment / input tax

VAT Act **§19** restricts input tax on entertainment (food, beverages, tobacco, accommodation, hospitality) — finance must apply NamRA rules to supplier invoices; do not assume full input credit on F&B costs.

---

## 4. Stream B — Buffr (platform B2B)

| Field | Documented value |
|-------|------------------|
| Legal name | Buffr Financial Services CC |
| VAT ref | 0031148015 (confirm on certificate) |
| Supplies | Platform fees, subscriptions, processing markup |

### 4.1 Product behaviour

- `getBuffrTaxProfile()`, `computeVatOnTaxableSupply()`
- Platform billing: `PlatformBillingService`, `PlatformFeeService`
- B2B tax invoice checklist: `NAMRA_TAX_INVOICE_CHECKLIST`

Guest card receipts must **not** imply guests pay Buffr for room charges — see PRD §3.5 money roles.

---

## 5. NamRA e-invoicing (upcoming)

| Item | Detail |
|------|--------|
| Budget target | April 2026 (`NAMRA_EINVOICING_TARGET_MONTH`) |
| Current product state | Constants + SLA backlog only |
| Required work | ITAS integration, invoice numbering, PDF/XML export |

**Gap G-02** in [`NAMIBIA_REGULATORY_FRAMEWORK.md`](NAMIBIA_REGULATORY_FRAMEWORK.md).

---

## 6. Income tax & PAYE

| Entity | Documented income tax ref | Notes |
|--------|---------------------------|-------|
| Etuna Guesthouse And Tours CC | 05517026-011 | Corporate tax rate per annual budget (30% from 2025) |
| Buffr Financial Services CC | 15560644-011 | Separate returns |

Employee tax (PAYE) and withholding tax references are on the Etuna NamRA certificate block — payroll outside this repo.

---

## 7. Evidence checklist

- [ ] NamRA VAT registration certificates (both entities)
- [ ] Tax good standing certificates (current)
- [ ] Last 4 VAT returns + payment proof
- [ ] Property VAT report export (`/reports/property-vat`) sample monthly
- [ ] Sample guest tax invoice (folio PDF when implemented)

Store under `docs/compliance/evidence/YYYY-MM/tax/`.

---

## 8. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 16, 2026 | Finance | Initial dual-VAT operational guide |

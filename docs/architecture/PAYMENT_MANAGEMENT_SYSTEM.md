# Payment-Management System — End-to-End (verified 2026-06-09)

Single-property hotel PMS. This is the **verified** systems map of how money flows; it corrects an
automated audit that over-flagged several "critical" gaps which the code does **not** have.

## End-to-end flow (what's wired & coherent)

```
Booking ──ensureBookingChargeForBooking──▶ booking_charges (room/fnb/tax/adjustment, status=open)
   │                                              │
   │  deposit % (lib/booking/deposit.ts, 30% def) │
   ▼                                              ▼
Payment rails ───────────────────────────▶ settleFolio() / applyBookingDeposit()
  • Adumo card  (completeAdumoVirtualPayment.ts — token result authoritative, amount-matched, idempotent)
  • NamQR       (HospitalityNamQrPaymentService → settleOffPlatformFolio → settleFolio)
  • Manual EFT/wallet/cash (ManualPaymentService → settleOffPlatformFolio)
        │  each writes: transactions (completed) + negative booking_charges (chargeType=payment) + booking.paymentStatus
        ▼
  platform card fee accrued (PlatformFeeService → platform_fee_accruals)
        │
        ▼
Disputes/reversals (PaymentDisputeService → payment_disputes + reversing txn + adjustment charge + booking=disputed)
        │
        ▼
GL / accounting (HospitalityAccountingService.getPeriodReport — DERIVED per period):
   settled charge  → Dr 1100 AR / Cr revenue 4xxx / Cr 2100 VAT-output
   guest payment   → Dr cash|bank|card-clearing (1000/1010/1020) / Cr 1100 AR
   platform fee    → Dr 5100 fee-expense / Dr 2110 VAT-input / Cr 2300 Buffr AP
        │
        ▼
Reporting: /reports/accounting (summary, journal-lines, period-close), /reports/commission, /reports/property-vat
Night audit (NightAuditService): room postings, no-shows, stayovers, occupancy/ADR/RevPAR → night_audit_runs
Async: paymentOutbox → PAYMENT_RECEIPT_EMAIL (cron dispatch, ret/backoff)
```

## Verified-correct (do NOT "fix")
- **Adumo card path** is production-grade: signed `_RESPONSE_TOKEN` is authoritative (signature + cuid/auid
  + mref→session + amount-match + token `result`), idempotent; both confirm + webhook share
  `completeAdumoVirtualPayment`. PCI-minimising (only `lastFour` stored).
- **GL is coherent double-entry** with VAT output (2100) and **VAT input (2110)**, and **platform fees DO
  expense to 5100** — contrary to the audit's claim. Derive-on-read from settled charges + payments + fee
  accruals is a valid design for a single-property accountant export.
- **Deposits settle** via `applyBookingDeposit` (booking→paid, transaction + booking_charge).
- **Disputes** reverse the folio (reversing txn + adjustment charge + booking=disputed); the adjustment
  flows back through the same GL derivation.

## Genuine remaining gaps (verified) — bounded, not architectural rewrites
| Gap | Reality | Severity |
|---|---|---|
| **Electronic reconciliation** | `app/api/payments/reconciliation` reconciles **cash only**; Adumo/NamQR/EFT `transactions.gatewayTransactionId` are never matched to a bank/processor statement. | High — the one real systemic gap |
| **Retention enforcement** | `record_retention_audit` rows exist but no job purges/locks by `retentionExpiresAt`. | Medium (data-lifecycle; implement carefully — it deletes/anonymises) |
| **Two NamQR encoders** | `namqr-core.ts` (tag-26) vs `nrtc-payload.ts` (tag-17) both CRC-correct; pick the NamClear-registered one. | Medium |
| **Consumer disclosure UI** | No separate convenience-fee/disputes-contact display on payment screens. | Low |
| **Dispute "won" reversal-of-reversal** | `resolveDispute` updates status only; a won chargeback doesn't re-credit. | Low (most resolve lost/refunded) |
| **Open-banking PIS completion** | `PaymentInitiationService` records `transactions` but no completion→folio; acknowledged-deferred (NamQR is primary rail). | Low (documented defer) |
| **Cyber-incident SOP / BoN ≤24h** | Entity ops obligation, not code. | Ops |

## Pre-existing data issue (separate from payments)
`apply-all-missing-migrations` reports `0044_schema_cleanup` fails: `rooms_status_check` violated by an
existing `rooms` row — normalise the offending status value.

## Done this session
TS build (27→0), dispute/chargeback model (#11, migration 0061 on Neon, 51/51), honest PSD-12/tokenisation
flags (#2). See `docs/compliance/BON_PAYMENTS_MERCHANT_COMPLIANCE.md`.

## Recommendation
The system does **not** need a GL/accounting rebuild. Complete the bounded gaps in order:
**electronic reconciliation → NamQR consolidation → retention job (careful, deletes data) → disclosures/SOP.**
Retention enforcement deletes/anonymises real data and should be implemented with a dry-run + review, not rushed.

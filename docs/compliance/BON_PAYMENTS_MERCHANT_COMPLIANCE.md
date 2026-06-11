# Bank of Namibia — Payments Compliance Map (Hotel Etuna as merchant)

**Date:** 2026-06-09 · **Scope:** single-property hotel **merchant** accepting payments (deposits, Adumo
card, EFT, e-money/wallet, NamQR, hub PIS) — **not** a PSP/acquirer/e-money issuer.
**Sources:** `mba-agent/documents/mba-agent/regulatory/namibia/` (BoN PSD-3 e-money, PSD-4 cards, PSD-9
EFT, PSD-12 operational/cyber standards) + `namibia_qr_code_standards_v2.md`. Verified against code.

## Correctly out of scope (bank/issuer-only — do NOT implement on the hotel)
PSD-3 e-money issuer authorisation, N$1.5M capital, trust account, 100% float backing, daily float
reconciliation, dormant-wallet rules; PSD-4 card issuance/acquiring/switching; PSD-9 clearing/settlement
mechanics. The wallet/e-money path settles to the hotel's own bank account — issuer duties bind the bank.

## Merchant obligations → code status (verified)

| # | Obligation (reg) | Status | Evidence | Fix |
|---|---|---|---|---|
| 1 | 2FA on every payment initiation — PSD-12 §12.2 | **PARTIAL (defensible card path)** | Demo rail: `require2FA` on `app/api/payments/initiate/route.ts`. **Live card:** `app/api/payments/virtual/initiate/route.ts` — guest must be authenticated + `assertStayAccess`; **step-up MFA is Adumo hosted 3DS** on `initialisevirtual` (test app `23ADADC0-…`, OTP `test123`). Settlement stores gateway txn in `transactions`/`payment_sessions` (no PAN). **Gap:** NamQR generate still lacks step-up. | Document 3DS discharge in payment evidence (`compliance/evidence/payments/`). Add step-up before NamQR/PIS instruction generation. |
| 2 | Encryption/tokenisation/masking — PSD-12 §12.1 | **DONE (2026-06-09)** | No PAN/CVV stored. `PaymentSecurityService.ts` flags now documented/honest: `psd12Compliant = twoFaVerified || threeDSecureProvided`; `card_tokenized` comment states Adumo's hosted page tokenises every PAN (merchant stores only `lastFour`) — accurate for this hosted-page architecture. | Done. |
| 3 | NamQR payee-presented TLV (CRC-16 ISO/IEC 13239, poly 0x1021/init 0xFFFF, MCC, 53=516, tag 63 last) | **DONE (2026-06-09)** | Consolidated to the single canonical NamClear-registered encoder `buildNamQrPayeePresentedPayload` (tag-17 NRTC); all live paths route through it. Tag-26 `encodeNamQrPayloadV5` deprecated → throws. 5 encoder tests + tsc clean. | Done. |
| 4 | CRC + amount integrity on settle | **PARTIAL** | Scan-path validation exists; merchant confirm (`HospitalityNamQrPaymentService.confirmDeskPayment`) settles on typed `bankReference` without re-checking amount==QR amount / unexpired issued code. | Before closing folio, assert paid amount == issued QR amount and `qrReference` maps to a live `namqrCodes` row. |
| 5 | Transaction record-keeping; BoN inspection — PSD-4 §13/PSD-12 §14 | **MET** | `transactions` (unique ref, gateway ids), `auditTrail` on settlement, `payment_security_audit`. | Ensure inspection export tooling exists. |
| 6 | 7-year financial record retention | **DECLARED, not enforced** | `record_retention_audit` table + "7y" comments; **no purge/lock job** reads `retentionExpiresAt` (verified: only schema references it). | Add a retention-enforcement job (scheduler) keyed on `retentionExpiresAt`. |
| 7 | Daily reconciliation | **Cash MET; electronic GAP** | `app/api/payments/reconciliation/route.ts` reconciles cash. No daily match of Adumo/NamQR/EFT vs bank statement. | Extend reconciliation to electronic rails (statement match; surface unmatched). |
| 8 | Fraud monitoring of all payments — PSD-12 §11.6 | **PARTIAL** | **`PsdFraudGate.checkTransaction`** on live card init `app/api/payments/virtual/initiate/route.ts` (2026-06-10); demo `payments/initiate` also gated. NamQR/PIS init still ungated. Velocity/geo stubs remain in `PaymentSecurityService.ts:458-468`. | Extend `PsdFraudGate` to NamQR/PIS init; implement real velocity DB lookback. |
| 9 | Cyber-incident report to BoN ≤24h, impact ≤1 month — PSD-12 §11.13-15 | **MISSING** | No incident-reporting workflow in payment domain. | Entity SOP + incident register + BoN notification template (owner action; low code surface). |
| 10 | Consumer disclosure (fees unbundled; dispute channel) — PSD-3 §14.3-4 (merchant analogue) | **PARTIAL** | Deposit % disclosed; no separate convenience-fee/tip display at QR/checkout; no in-flow disputes contact. | Show amount + fee separately; add disputes/complaints contact on payment screens. |
| 11 | Dispute / chargeback handling — PSD-4 | **DONE (2026-06-09)** | New `payment_disputes` table (migration `0061`, applied on Neon, `test:db:migrations` 51/51). `PaymentDisputeService.openDispute` reverses the folio (reversing transaction + adjustment charge + booking→`disputed`), idempotent per gateway txn. Adumo webhook routes `REVERSED/REFUNDED/CHARGEBACK` statuses to `openDispute`. Desk UI `app/(dashboard)/payments/disputes` + RBAC'd API `app/api/payments/disputes`. | Done. |
| 12 | Settlement timing / real-time crediting | **N/A merchant** | NamQR settles off-platform to the bank; merchant confirms post-settlement. | None. |

## Remediation priority (money domain — Wave 2/3)
**#1 2FA on live paths → #8 fraud on live paths → #11 disputes model → #7 electronic reconciliation →
#6 retention enforcement → #3 single canonical QR encoder → #9 incident SOP → #10 disclosures →
#2 drop cosmetic flags.**

## Notes
- **Adumo Virtual (2026-06-10):** fraud gate on `virtual/initiate`; 3DS step-up on Adumo HPP discharges PSD-12 §12.2 for card. Remaining gap: NamQR/PIS paths + velocity depth.
- Demo endpoint `app/api/compliance/psd/payment-security/route.ts` remains for compliance UI drills — not the production card rail.
- #9 and parts of #1/#10 are **entity/ops SOPs**, not code — track as owner actions.

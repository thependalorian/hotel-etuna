/**
 * Regulatory context for engineering (not legal advice)
 *
 * Purpose: Maps product controls to frameworks referenced in Buffr schema/docs
 * Location: lib/compliance/regulatory-context.ts
 *
 * Use: JSDoc @see in audit actions, compliance UI footnotes, internal training.
 *
 * | Area            | Framework / basis (as modeled in repo)              | Typical control
 * |-----------------|------------------------------------------------------|------------------
 * | Audit records   | `audit_trail` — migration cites ETA record-keeping  | Immutable-style log; who/when/what; tenant scope
 * | Consumer rights | `consumer_rights_requests`                          | Track requests, deadlines, resolution
 * | Incidents       | `cybersecurity_incidents` (PSD-12-style fields)      | Severity, detection, BoN reporting timestamps
 * | Payments / OB   | Open banking + trust account tables in schema        | Separate from support; keep scoped APIs
 * | Fraud ops       | Observe failed txs + OB API errors + NPS fraud intel | Monitoring; not a substitute for bank fraud systems
 *
 * **Your local pack** (Downloads): align implementation reviews with PDFs there — BoN PSD (PSD-1, PSD-3,
 * PSD-12, …), ETA 2019, Namibia Open Banking, NPS Fraud Trend Report, PSMA, etc.
 * This file does not interpret law; it ties schema/features to those materials for engineering.
 *
 * Implementation must stay minimal in logs (no full PII in `new_values` for replies).
 */

/** Folder name under Downloads (for runbooks / onboarding links) */
export const REGULATORY_PACK_FOLDER = 'Regulation & Compliance Resources 2';

/**
 * Index of materials in the typical compliance pack — filenames as stored on disk.
 * @see file paths under ~/Downloads/Regulation & Compliance Resources 2
 */
export const REGULATORY_MATERIALS_INDEX = [
  {
    key: 'eta_2019',
    label: 'Electronic Transactions Act 4 of 2019',
    file: 'Electronic Transactions Act 4 of 2019.pdf',
    engineeringFocus:
      'Electronic records, consumer-facing processes; pair with `audit_trail` + `consumer_rights_requests`.',
  },
  {
    key: 'psd1_psp',
    label: 'PSD-1 — Licensing & authorisation of PSPs',
    file: 'Determination on the Licensing and Authorisation of Payment Service Providers in Namibia (PSD-1) 2026.pdf',
    engineeringFocus: 'Payment service scope; map live payment flows + trust reserve models to licensed activities.',
  },
  {
    key: 'psd3_emoney',
    label: 'PSD-3 — Electronic money',
    file: 'Determination on Issuing of Electronic Money in Namibia (PSD-3).pdf',
    engineeringFocus: 'E-money issuance rules; align wallet / stored value features if applicable.',
  },
  {
    key: 'psd12_cyber',
    label: 'PSD-12 — Operational & cybersecurity (NPS)',
    file: 'Determination of the Operational and Cybersecurity Standards within the National Payment System (PSD-12).pdf',
    engineeringFocus: 'Incidents, availability, recovery; use `cybersecurity_incidents` + audit trail.',
  },
  {
    key: 'open_banking_na',
    label: 'Namibia Open Banking Standards',
    file: 'Namibia Open Banking Standards.pdf',
    engineeringFocus: 'Consent, AIS/PIS; pair with `ob_consent_tokens`, `ob_api_transactions`, `ob_participants`.',
  },
  {
    key: 'nps_fraud',
    label: 'NPS fraud trend report',
    file: 'NPS FRAUD TREND REPORT 10 Years.pdf',
    engineeringFocus: 'Fraud typologies; monitor `transactions` + `ob_api_transactions` anomalies (dashboard KPIs).',
  },
  {
    key: 'psma',
    label: 'Payment System Management Act 14 of 2023',
    file: 'PAYMENT SYSTEM MANAGEMENT ACT, ACT 14 OF 2023.pdf',
    engineeringFocus: 'NPS legal baseline; governance of payment features.',
  },
] as const;

/** Standard audit action names — keep stable for reporting filters */
export const AuditActions = {
  SUPPORT_TICKET_STATUS_UPDATE: 'support_ticket.status_update',
  SUPPORT_TICKET_ADMIN_REPLY: 'support_ticket.admin_reply',
  COMPLIANCE_SUMMARY_VIEWED: 'compliance.summary_viewed',
} as const;

/** Resource types written to `audit_trail.resource_type` */
export const AuditResourceTypes = {
  SUPPORT_TICKET: 'support_ticket',
  COMPLIANCE: 'compliance',
  CONSUMER_RIGHTS_REQUEST: 'consumer_rights_request',
  OPEN_BANKING: 'open_banking',
  PAYMENT: 'payment',
  SECURITY: 'security',
} as const;

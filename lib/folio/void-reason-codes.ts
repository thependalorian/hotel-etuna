/**
 * Folio void reason codes — PSD-12 audit trail (OSS W5 / pura-pms pattern).
 * Location: /lib/folio/void-reason-codes.ts
 */

export const FOLIO_VOID_REASON_CODES = [
  'duplicate_charge',
  'guest_dispute',
  'staff_error',
  'other',
] as const;

export type FolioVoidReasonCode = (typeof FOLIO_VOID_REASON_CODES)[number];

export const FOLIO_VOID_REASON_LABELS: Record<FolioVoidReasonCode, string> = {
  duplicate_charge: 'Duplicate charge',
  guest_dispute: 'Guest dispute',
  staff_error: 'Staff error',
  other: 'Other',
};

export function isFolioVoidReasonCode(value: string): value is FolioVoidReasonCode {
  return (FOLIO_VOID_REASON_CODES as readonly string[]).includes(value);
}

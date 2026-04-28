/**
 * Standard shapes for `transactions.metadata` and related persistence
 *
 * Purpose: Keep `rail` aligned with keys in `NAMIBIA_PAYMENT_RAILS` for `payments-by-rail` reports
 * Location: lib/payments/transaction-metadata.ts
 */

import { NAMIBIA_PAYMENT_RAILS } from './namibia-payment-rails';

const KNOWN_RAIL_KEYS = new Set(NAMIBIA_PAYMENT_RAILS.map((r) => r.key));

export function isKnownNamibiaRailKey(key: string): boolean {
  return KNOWN_RAIL_KEYS.has(key);
}

/** Use when inserting / updating a transaction row (merge with acquirer-specific fields as needed) */
export function buildTransactionMetadata(input: {
  /** Key from `NAMIBIA_PAYMENT_RAILS` e.g. namqr | eft | card */
  railKey: string;
  bankReference?: string;
  namqrRef?: string;
  acquirerRef?: string;
  guestVisibleNote?: string;
}): Record<string, unknown> {
  return {
    rail: input.railKey,
    ...(input.bankReference ? { bank_reference: input.bankReference } : {}),
    ...(input.namqrRef ? { namqr_ref: input.namqrRef } : {}),
    ...(input.acquirerRef ? { acquirer_ref: input.acquirerRef } : {}),
    ...(input.guestVisibleNote ? { note: input.guestVisibleNote } : {}),
  };
}

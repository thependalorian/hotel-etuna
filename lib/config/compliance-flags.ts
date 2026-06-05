/**
 * Hospitality compliance feature flags — Hotel Etuna is guesthouse ops, not bank AML.
 * Location: lib/config/compliance-flags.ts
 */

/** PEP screening is off for Hotel Etuna (Buffr Hub / FSP products may enable separately). */
export function isPepScreeningEnabled(): boolean {
  const raw = process.env.HOSPITALITY_PEP_SCREENING_ENABLED?.trim().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return false;
}

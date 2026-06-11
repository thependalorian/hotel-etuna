/**
 * Hospitality compliance feature flags — Hotel Etuna is guesthouse ops, not bank AML.
 * Location: lib/config/compliance-flags.ts
 */

/** Tamper-evident SHA-256 hash chain on `audit_trail` (OSS Wave W3). */
export function isAuditHashChainEnabled(): boolean {
  const raw = process.env.AUDIT_HASH_CHAIN_ENABLED?.trim().toLowerCase();
  if (raw === 'false' || raw === '0') return false;
  if (raw === 'true' || raw === '1') return true;
  return true;
}

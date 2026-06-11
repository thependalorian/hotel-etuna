/**
 * Folio payment amount helpers — partial pay capped to balance due.
 * Location: lib/utils/folio-pay.ts
 */

import { roundMoney, toNumber } from '@/lib/utils/money';

/** Resolve pay amount from optional partial input, capped at balance due. */
export function resolveFolioPayAmount(amountInput: string | undefined, balanceDue: number): number {
  if (!amountInput?.trim()) return roundMoney(balanceDue);
  const parsed = toNumber(amountInput);
  if (parsed <= 0) return roundMoney(balanceDue);
  return roundMoney(Math.min(parsed, balanceDue));
}

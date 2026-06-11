/**
 * Money helpers — shared parsing and 2-decimal rounding for NAD folio/tax flows.
 * Location: lib/utils/money.ts
 */

/** Parse Drizzle decimal/string/null to a finite number (0 when invalid). */
export function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Round to 2 decimal places (hotel folio / VAT standard). */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Display folio line amount with currency code prefix. */
export function formatFolioAmount(currency: string, amount: number): string {
  return `${currency} ${roundMoney(amount).toFixed(2)}`;
}

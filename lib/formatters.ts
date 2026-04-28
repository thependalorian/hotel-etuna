/**
 * Formatting Utilities
 * Purpose: Central Namibia-focused date, currency, and number formatting helpers.
 * Location: /lib/formatters.ts
 */

const DEFAULT_LOCALE = 'en-NA';
const DEFAULT_CURRENCY = 'NAD';

export function formatDate(value: Date | string | number | null | undefined, locale = DEFAULT_LOCALE): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(value: Date | string | number | null | undefined, locale = DEFAULT_LOCALE): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatCurrencyNAD(value: number | string | null | undefined, locale = DEFAULT_LOCALE): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatCompactNumber(value: number | string | null | undefined, locale = DEFAULT_LOCALE): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number.isFinite(amount) ? amount : 0);
}

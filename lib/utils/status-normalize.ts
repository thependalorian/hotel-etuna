/**
 * Normalize DB status strings for UI comparisons (DRY across dashboard)
 *
 * Purpose: Accept snake_case or legacy UPPERCASE enums in one place
 * Location: /lib/utils/status-normalize.ts
 */

export function normalizeDbStatus(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase().replace(/\s+/g, '_');
}

/** DaisyUI badge class for booking lifecycle (dashboard) */
export function bookingStatusBadgeClass(status: string | null | undefined): string {
  const s = normalizeDbStatus(status);
  if (s === 'confirmed' || s === 'checked_in') return 'badge-success';
  if (s === 'checked_out') return 'badge-info';
  if (s === 'cancelled' || s === 'no_show') return 'badge-error';
  return 'badge-warning';
}

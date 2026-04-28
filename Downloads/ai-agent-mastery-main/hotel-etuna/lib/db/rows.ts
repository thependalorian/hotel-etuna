/**
 * Database Row Normalization
 * Purpose: Normalize Neon/pg raw query results into arrays and first-row values.
 * Location: /lib/db/rows.ts
 */

type RowsResult<T> = T[] | { rows?: T[] };

export function normalizeRows<T = Record<string, unknown>>(result: RowsResult<T> | unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows?: unknown }).rows;
    return Array.isArray(rows) ? (rows as T[]) : [];
  }

  return [];
}

export function firstRow<T = Record<string, unknown>>(result: RowsResult<T> | unknown): T | undefined {
  return normalizeRows<T>(result)[0];
}

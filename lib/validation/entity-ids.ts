/**
 * Entity id validation (Prisma text/cuid or UUID-shaped strings).
 *
 * Purpose: Buffr Host Neon/Prisma uses `text` primary keys; strict `z.uuid()`
 * rejects valid production ids. Use these helpers on API bodies and query params.
 * Location: lib/validation/entity-ids.ts
 */

import { z } from 'zod';

const MAX_LEN = 200;

export function entityId(message = 'Invalid id') {
  return z.string().min(1, { message }).max(MAX_LEN, { message: 'Id too long' });
}

export function entityIdOptional(message = 'Invalid id') {
  return z.string().min(1, { message }).max(MAX_LEN).optional();
}

export function entityIdNullableOptional() {
  return z.string().min(1).max(MAX_LEN).nullable().optional();
}

export function entityIdArray(min = 1) {
  return z.array(entityId()).min(min);
}

export function isValidEntityId(value: string | undefined | null): boolean {
  if (value == null || value === '') return false;
  return value.length <= MAX_LEN;
}

/**
 * Match a CRM guest row by WhatsApp sender id (phone variants).
 *
 * Purpose: Attach guestId to Sofia context when phone is stored on guests.phone.
 * Location: /lib/services/whatsapp/findGuestByWhatsappPhone.ts
 */

import { db } from '@/lib/db';
import { guests } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

function phoneVariants(waFrom: string): string[] {
  const digits = waFrom.replace(/\D/g, '');
  const set = new Set<string>();
  if (waFrom) set.add(waFrom);
  if (digits) {
    set.add(digits);
    set.add(`+${digits}`);
  }
  return [...set];
}

export async function findGuestIdByWhatsappPhone(
  tenantId: string,
  waFrom: string
): Promise<string | undefined> {
  const variants = phoneVariants(waFrom);
  if (variants.length === 0) return undefined;

  const [row] = await db
    .select({ id: guests.id })
    .from(guests)
    .where(and(eq(guests.tenantId, tenantId), inArray(guests.phone, variants)))
    .limit(1);

  return row?.id;
}

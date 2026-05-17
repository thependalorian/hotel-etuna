/**
 * Link hub traveller accounts (users) to CRM guests rows by email.
 * Location: lib/services/booking/linkGuestAccount.ts
 */

import { db, guests } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { GuestService } from '@/lib/services/booking/GuestService';

export type LinkGuestAccountInput = {
  hubTenantId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

/** Normalize email for users/guests/stay lookups. */
export function normalizeAccountEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Upsert guests row for a registered hub guest so /api/guest/stays can resolve bookings.
 */
export async function linkGuestAccountForHubUser(input: LinkGuestAccountInput) {
  const email = normalizeAccountEmail(input.email);
  const guestService = new GuestService();

  const existing = await db
    .select()
    .from(guests)
    .where(sql`lower(${guests.email}) = ${email}`)
    .limit(1);

  const row = existing[0];
  if (row) {
    const [updated] = await db
      .update(guests)
      .set({
        isSignedUp: true,
        signUpCompletedAt: sql`now()`,
        ...(input.firstName != null && { firstName: input.firstName }),
        ...(input.lastName != null && { lastName: input.lastName }),
        ...(!row.tenantId && { tenantId: input.hubTenantId }),
      })
      .where(eq(guests.id, row.id))
      .returning();
    return updated ?? row;
  }

  return guestService.createGuest(input.hubTenantId, {
    email,
    firstName: input.firstName ?? undefined,
    lastName: input.lastName ?? undefined,
    isSignedUp: true,
  });
}

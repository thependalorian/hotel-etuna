/**
 * CRM consent history service
 *
 * Purpose: Append-only marketing consent evidence for guest CRM operations.
 * Location: /lib/services/crm/CrmConsentService.ts
 */

import { db, crmConsentEvents, guests } from '@/lib/db';
import type { CrmConsentEvent } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { and, desc, eq } from 'drizzle-orm';

export type RecordConsentInput = {
  tenantId: string;
  guestId: string;
  newMarketingConsent: boolean;
  previousMarketingConsent?: boolean | null;
  source?: string;
  reason?: string | null;
  changedByUserId?: string | null;
  metadata?: Record<string, unknown>;
};

export class CrmConsentService {
  async listEvents(tenantId: string, guestId: string): Promise<CrmConsentEvent[]> {
    try {
      return await db
        .select()
        .from(crmConsentEvents)
        .where(and(eq(crmConsentEvents.tenantId, tenantId), eq(crmConsentEvents.guestId, guestId)))
        .orderBy(desc(crmConsentEvents.createdAt));
    } catch (error) {
      return handleServiceError(error, 'Error listing CRM consent events');
    }
  }

  async recordConsentChange(input: RecordConsentInput): Promise<CrmConsentEvent> {
    try {
      const [guest] = await db
        .select({
          id: guests.id,
          marketingConsent: guests.marketingConsent,
        })
        .from(guests)
        .where(and(eq(guests.id, input.guestId), eq(guests.tenantId, input.tenantId)))
        .limit(1);

      if (!guest) {
        throw new AppError(404, 'Guest not found');
      }

      const previous =
        input.previousMarketingConsent === undefined
          ? guest.marketingConsent === true
          : input.previousMarketingConsent;

      const [event] = await db.transaction(async (tx) => {
        await tx
          .update(guests)
          .set({
            marketingConsent: input.newMarketingConsent,
            updatedAt: new Date(),
          })
          .where(and(eq(guests.id, input.guestId), eq(guests.tenantId, input.tenantId)));

        return tx
          .insert(crmConsentEvents)
          .values({
            tenantId: input.tenantId,
            guestId: input.guestId,
            previousMarketingConsent: previous,
            newMarketingConsent: input.newMarketingConsent,
            source: input.source ?? 'dashboard',
            reason: input.reason ?? null,
            changedByUserId: input.changedByUserId ?? null,
            metadata: input.metadata ?? {},
          })
          .returning();
      });

      if (!event) {
        throw new AppError(500, 'Consent event was not recorded');
      }

      return event;
    } catch (error) {
      if (error instanceof AppError) throw error;
      return handleServiceError(error, 'Error recording CRM consent event');
    }
  }
}

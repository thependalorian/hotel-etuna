/**
 * CRM outreach touch lifecycle — validates transitions + marketing consent (Namibia / GDPR-minded)
 *
 * Purpose: Sales/marketing touches to guests stored in Buffr CRM; uses LangGraph lifecycle validator.
 * Location: lib/services/crm/CrmOutreachService.ts
 */

import { and, desc, eq } from 'drizzle-orm';
import { db, crmOutreachTouches, guests } from '@/lib/db';
import { invokeLifecycleTransition } from '@/lib/workflows/genericLifecycleGraph';
import { CRM_OUTREACH_TOUCH_TRANSITIONS } from '@/lib/workflows/domainTransitions';

export class CrmOutreachService {
  async listTouches(tenantId: string, filters?: { guestId?: string; status?: string }) {
    const conds = [eq(crmOutreachTouches.tenantId, tenantId)];
    if (filters?.guestId) conds.push(eq(crmOutreachTouches.guestId, filters.guestId));
    if (filters?.status) conds.push(eq(crmOutreachTouches.status, filters.status));
    const whereClause = conds.length > 1 ? and(...conds) : conds[0];
    return db
      .select()
      .from(crmOutreachTouches)
      .where(whereClause)
      .orderBy(desc(crmOutreachTouches.updatedAt));
  }

  async createTouch(input: {
    tenantId: string;
    guestId: string;
    propertyId?: string | null;
    channel: string;
    campaignKey?: string | null;
    messageSubject?: string | null;
    messageBody?: string | null;
    status?: string;
    scheduledAt?: Date | null;
    /** When set with status <code>sent</code>, records transactional lifecycle touches without lifecycle transition metadata. */
    sentAt?: Date | null;
    metadata?: Record<string, unknown>;
    /** e.g. booking_lifecycle — used for transactional vs marketing segmentation in reporting */
    workflowStage?: string | null;
  }) {
    const [g] = await db
      .select({ id: guests.id })
      .from(guests)
      .where(and(eq(guests.id, input.guestId), eq(guests.tenantId, input.tenantId)))
      .limit(1);
    if (!g) return null;

    const [row] = await db
      .insert(crmOutreachTouches)
      .values({
        tenantId: input.tenantId,
        guestId: input.guestId,
        propertyId: input.propertyId ?? null,
        channel: input.channel,
        campaignKey: input.campaignKey ?? null,
        messageSubject: input.messageSubject ?? null,
        messageBody: input.messageBody ?? null,
        status: input.status ?? 'draft',
        scheduledAt: input.scheduledAt ?? null,
        ...(input.sentAt ? { sentAt: input.sentAt } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
        ...(input.workflowStage !== undefined ? { workflowStage: input.workflowStage } : {}),
      })
      .returning();
    return row ?? null;
  }

  /**
   * Alias for {@link createTouch} — semantic name for transactional / lifecycle audits (e.g. booking emails).
   * Same behavior as <code>createTouch</code>.
   */
  logTouch(input: Parameters<CrmOutreachService['createTouch']>[0]): ReturnType<CrmOutreachService['createTouch']> {
    return this.createTouch(input);
  }

  async transitionStatus(
    tenantId: string,
    touchId: string,
    targetStatusRaw: string
  ): Promise<{ ok: boolean; status?: string; error?: string }> {
    const [row] = await db
      .select()
      .from(crmOutreachTouches)
      .where(and(eq(crmOutreachTouches.id, touchId), eq(crmOutreachTouches.tenantId, tenantId)))
      .limit(1);

    if (!row) return { ok: false, error: 'Outreach touch not found' };

    const outcome = await invokeLifecycleTransition(
      'crm_outreach_touch',
      CRM_OUTREACH_TOUCH_TRANSITIONS,
      row.status,
      targetStatusRaw
    );

    if (outcome.errorMessage) {
      return { ok: false, error: outcome.errorMessage };
    }

    const next = outcome.resolvedStatus ?? targetStatusRaw;

    if (next === 'scheduled' || next === 'sent') {
      const [g] = await db
        .select({ marketingConsent: guests.marketingConsent })
        .from(guests)
        .where(and(eq(guests.id, row.guestId), eq(guests.tenantId, tenantId)))
        .limit(1);
      if (!g?.marketingConsent) {
        return {
          ok: false,
          error:
            'Guest has not opted in to marketing (marketing_consent). Use transactional messaging only.',
        };
      }
    }

    await db
      .update(crmOutreachTouches)
      .set({
        status: next,
        workflowStage: outcome.workflowStage ?? 'transition_ok',
        updatedAt: new Date(),
        ...(next === 'sent' ? { sentAt: new Date() } : {}),
      })
      .where(eq(crmOutreachTouches.id, touchId));

    return { ok: true, status: next };
  }
}

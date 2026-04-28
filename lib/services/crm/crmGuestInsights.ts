/**
 * CRM guest metrics for segmentation workflow (bookings-backed)
 *
 * Purpose: Feed `runGuestMarketingSegmentWorkflow` without ML.
 * Location: lib/services/crm/crmGuestInsights.ts
 */

import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, bookings, guests } from '@/lib/db';
import {
  runGuestMarketingSegmentWorkflow,
  type HospitalityMarketingSegment,
} from '@/lib/workflows/hospitalityMarketingWorkflows';

export type GuestCrmInsights = {
  lastStayDaysAgo: number | undefined;
  totalBookings: number;
  lifetimeValueNad: number;
  marketingConsent: boolean;
  segment: HospitalityMarketingSegment;
  recommendedChannels: string[];
  notes: string | undefined;
};

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

export async function getGuestCrmInsights(
  tenantId: string,
  guestId: string
): Promise<GuestCrmInsights | null> {
  const [guest] = await db
    .select({
      marketingConsent: guests.marketingConsent,
    })
    .from(guests)
    .where(and(eq(guests.id, guestId), eq(guests.tenantId, tenantId)))
    .limit(1);

  if (!guest) return null;

  const completed = await db
    .select({
      checkOutDate: bookings.checkOutDate,
      totalAmount: bookings.totalAmount,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        eq(bookings.guestId, guestId),
        inArray(bookings.status, ['checked_out', 'checked_in', 'confirmed'])
      )
    )
    .orderBy(desc(bookings.checkOutDate));

  const [agg] = await db
    .select({
      n: sql<number>`count(*)::int`,
      revenue: sql<string>`coalesce(sum(${bookings.totalAmount}), 0)::text`,
    })
    .from(bookings)
    .where(and(eq(bookings.tenantId, tenantId), eq(bookings.guestId, guestId)));

  const totalBookings = Number(agg?.n ?? 0);
  const lifetimeValueNad = parseFloat(agg?.revenue ?? '0') || 0;

  let lastStayDaysAgo: number | undefined;
  const last = completed[0];
  if (last?.checkOutDate) {
    lastStayDaysAgo = daysSince(new Date(String(last.checkOutDate)));
  } else if (totalBookings === 0) {
    lastStayDaysAgo = undefined;
  }

  const wf = await runGuestMarketingSegmentWorkflow({
    tenantId,
    guestId,
    lastStayDaysAgo,
    totalBookings,
    lifetimeValueNad,
    marketingConsent: guest.marketingConsent === true,
  });

  return {
    lastStayDaysAgo,
    totalBookings,
    lifetimeValueNad,
    marketingConsent: guest.marketingConsent === true,
    segment: wf.segment ?? 'general',
    recommendedChannels: wf.recommendedChannels ?? [],
    notes: wf.notes,
  };
}

/**
 * IntelligenceReportService — founder/admin digest payloads (daily, weekly, monthly).
 * Location: lib/services/platform/IntelligenceReportService.ts
 */

import {
  db,
  bookings,
  tenants,
  users,
  guestReviews,
  namqrPendingConfirmations,
  supportTickets,
  eq,
  and,
  gte,
  lte,
  isNotNull,
  notInArray,
} from '@/lib/db';
import { sql } from 'drizzle-orm';
import { accommodationBookingCondition } from '@/lib/bookings/booking-kind';
import { AiObservabilityService } from '@/lib/services/platform/AiObservabilityService';
import { getComplianceSnapshot } from '@/lib/compliance/compliance-snapshot';

export type DigestCadence = 'daily' | 'weekly' | 'monthly';

export type IntelligenceDigestSection = {
  title: string;
  bullets: string[];
};

export type IntelligenceDigest = {
  cadence: DigestCadence;
  generatedAt: string;
  windowLabel: string;
  sections: IntelligenceDigestSection[];
};

function windowDays(cadence: DigestCadence): number {
  if (cadence === 'daily') return 1;
  if (cadence === 'weekly') return 7;
  return 30;
}

export class IntelligenceReportService {
  async buildDigest(cadence: DigestCadence): Promise<IntelligenceDigest> {
    const days = windowDays(cadence);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sections: IntelligenceDigestSection[] = [];

    const [tenantCount] = await db.select({ count: sql<number>`count(*)::int` }).from(tenants);
    const [userCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(notInArray(users.role, ['super-admin']));

    const [arrivals] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(
        and(
          eq(bookings.checkInDate, sql`CURRENT_DATE`),
          eq(bookings.status, 'confirmed'),
          accommodationBookingCondition()
        ),
      );

    const [departures] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(
        and(eq(bookings.checkOutDate, sql`CURRENT_DATE`), accommodationBookingCondition())
      );

    const newBookings = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(gte(bookings.createdAt, since));

    const ai = await new AiObservabilityService().getSummary(Math.min(days, 30));
    const compliance = await getComplianceSnapshot();

    const [namqrRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(namqrPendingConfirmations)
      .where(eq(namqrPendingConfirmations.status, 'pending'));

    const [lowReviewRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(guestReviews)
      .where(and(lte(guestReviews.rating, 3), gte(guestReviews.createdAt, since)));

    const [escalatedSupport] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportTickets)
      .where(
        and(
          isNotNull(supportTickets.linearIssueId),
          notInArray(supportTickets.status, ['resolved', 'closed']),
        ),
      );

    const namqrPending = namqrRow?.count ?? 0;
    const openSupport = compliance.openSupportTickets;
    const lowReviews = lowReviewRow?.count ?? 0;
    const escalatedTickets = escalatedSupport?.count ?? 0;

    if (cadence === 'daily') {
      sections.push({
        title: 'Operations today',
        bullets: [
          `${arrivals?.count ?? 0} arrivals (confirmed)`,
          `${departures?.count ?? 0} departures`,
          `${namqrPending} NamQR payments awaiting desk approval`,
          `${lowReviews} guest reviews ≤3★ in the last 24h`,
        ],
      });
      sections.push({
        title: 'Platform health',
        bullets: [
          `${openSupport} open support tickets (${escalatedTickets} escalated to engineering)`,
          `${compliance.failedTransactions24h} failed payment events (24h)`,
          `${compliance.auditEvents24h} audit events (24h)`,
          `Sofia: ${ai.lowConfidenceCount} low-confidence replies (${days}d window)`,
        ],
      });
    }

    if (cadence === 'weekly' || cadence === 'monthly') {
      const kindCounts = await db
        .select({
          kind: bookings.bookingKind,
          count: sql<number>`count(*)::int`,
        })
        .from(bookings)
        .where(gte(bookings.createdAt, since))
        .groupBy(bookings.bookingKind);

      const countFor = (k: string) =>
        kindCounts.find((r) => (r.kind ?? 'accommodation') === k)?.count ?? 0;

      sections.push({
        title: 'Portfolio',
        bullets: [
          `${tenantCount.count ?? 0} tenants · ${userCount.count ?? 0} users`,
          `${newBookings[0]?.count ?? 0} new bookings (${countFor('accommodation')} stays, ${countFor('conference')} conference, ${countFor('campsite')} campsite)`,
          `AI tokens (30d cap): ${ai.totalTokens.toLocaleString()} across ${Object.keys(ai.tokensByProvider).length} providers`,
          `${ai.degradedProviderCount} Sofia provider fallbacks in AI window`,
        ],
      });
      sections.push({
        title: 'Risk & support',
        bullets: [
          `${openSupport} open support tickets`,
          `${compliance.openCyberIncidents} open cyber incidents`,
          `${compliance.pendingConsumerRights} pending consumer-rights requests`,
          `${lowReviews} reviews ≤3★ in period`,
          `${escalatedTickets} support tickets with engineering ref (open)`,
        ],
      });
    }

    if (cadence === 'monthly') {
      const revenueByKind = await db
        .select({
          kind: bookings.bookingKind,
          total: sql<string>`coalesce(sum(total_amount), 0)::text`,
        })
        .from(bookings)
        .where(
          and(
            gte(bookings.createdAt, since),
            sql`${bookings.status} IN ('confirmed', 'checked_in', 'checked_out', 'completed')`,
          ),
        )
        .groupBy(bookings.bookingKind);

      const revLine = (label: string, k: string) => {
        const row = revenueByKind.find((r) => (r.kind ?? 'accommodation') === k);
        return `${label}: N$ ${row?.total ?? '0'}`;
      };

      sections.push({
        title: 'Revenue snapshot',
        bullets: [
          revLine('Room stays', 'accommodation'),
          revLine('Conference', 'conference'),
          revLine('Campsite', 'campsite'),
          'Export VAT and accounting reports from Reports → VAT / Accounting',
          'Review platform billing under Payments → Platform billing',
        ],
      });
    }

    return {
      cadence,
      generatedAt: new Date().toISOString(),
      windowLabel: cadence === 'daily' ? 'Last 24 hours' : cadence === 'weekly' ? 'Last 7 days' : 'Last 30 days',
      sections,
    };
  }

  formatDigestPlainText(digest: IntelligenceDigest): string {
    const lines = [
      `Hotel Etuna — ${digest.cadence} intelligence digest`,
      digest.windowLabel,
      `Generated: ${digest.generatedAt}`,
      '',
    ];
    for (const section of digest.sections) {
      lines.push(section.title);
      for (const b of section.bullets) {
        lines.push(`  • ${b}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  /** Property-scoped weekly summary for owners/managers who opted in. */
  async buildPartnerWeeklyDigest(tenantId: string): Promise<IntelligenceDigest> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [tenant] = await db
      .select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const [newBookings] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(eq(bookings.tenantId, tenantId), gte(bookings.createdAt, since)));

    const [lowReviews] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(guestReviews)
      .where(
        and(
          eq(guestReviews.tenantId, tenantId),
          lte(guestReviews.rating, 3),
          gte(guestReviews.createdAt, since),
        ),
      );

    const [namqrPending] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(namqrPendingConfirmations)
      .where(
        and(eq(namqrPendingConfirmations.tenantId, tenantId), eq(namqrPendingConfirmations.status, 'pending')),
      );

    return {
      cadence: 'weekly',
      generatedAt: new Date().toISOString(),
      windowLabel: `Last 7 days · ${tenant?.name ?? 'Property'}`,
      sections: [
        {
          title: 'Weekly operations',
          bullets: [
            `${newBookings?.count ?? 0} new bookings`,
            `${namqrPending?.count ?? 0} NamQR payments pending desk approval`,
            `${lowReviews?.count ?? 0} guest reviews ≤3★`,
            'Review CRM outreach and housekeeping tasks in the dashboard',
          ],
        },
      ],
    };
  }
}

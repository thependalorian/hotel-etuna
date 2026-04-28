/**
 * Compliance snapshot for platform admins (reporting)
 * GET /api/admin/platform/compliance/summary
 *
 * Response: { data: ComplianceSnapshot, meta: { regulatoryNotes: string } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';
import { getComplianceSnapshot } from '@/lib/compliance/compliance-snapshot';
import { enforcePlatformAdminRateLimit } from '@/lib/compliance/with-admin-rate-limit';
import { REGULATORY_PACK_FOLDER } from '@/lib/compliance/regulatory-context';
import { getNamibiaPaymentRailsSummary, labelForRailBucket } from '@/lib/payments/namibia-payment-rails';
import { getPaymentsByRailSince } from '@/lib/compliance/payments-by-rail';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentPlatformAdmin();
    if (!user || !isPlatformAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limited = await enforcePlatformAdminRateLimit(request, user.id);
    if (limited) {
      return limited;
    }

    const daysRaw = parseInt(request.nextUrl.searchParams.get('paymentWindowDays') ?? '7', 10);
    const paymentWindowDays =
      Number.isNaN(daysRaw) || daysRaw < 1 ? 7 : Math.min(daysRaw, 90);
    const paymentSince = new Date(
      Date.now() - paymentWindowDays * 24 * 60 * 60 * 1000
    );

    const data = await getComplianceSnapshot();
    const paymentRails = getNamibiaPaymentRailsSummary();
    const paymentsByRailRaw = await getPaymentsByRailSince(paymentSince);
    const paymentsByRail = {
      windowDays: paymentWindowDays,
      since: paymentSince.toISOString(),
      rows: paymentsByRailRaw.map((r) => ({
        ...r,
        label: labelForRailBucket(r.bucket),
      })),
    };

    return NextResponse.json({
      data,
      paymentRails,
      paymentsByRail,
      reporting: {
        dashboard: '/admin/platform',
        auditLogs: '/admin/platform/audit',
        complianceJson: '/api/admin/platform/compliance/summary',
        paymentsByRail: `/api/admin/platform/compliance/payments?days=${paymentWindowDays}`,
        regulatoryPackFolder: REGULATORY_PACK_FOLDER,
        note:
          'In-app reporting: KPIs + paymentsByRail (metadata.rail / payment_gateway). PDF pack under Downloads. Namibia posture: no Stripe — paymentRails.stripeUsed.',
      },
      meta: {
        regulatoryNotes:
          'KPIs map to Drizzle tables: support, consumer_rights_requests (ETA-oriented), cybersecurity_incidents (PSD-12 style), audit_trail, namqr_codes, ob_api_transactions, transactions. Cross-check PDFs in your compliance pack — not legal advice.',
        regulatoryPackFolder: REGULATORY_PACK_FOLDER,
      },
    });
  } catch (err) {
    console.error('[compliance/summary]', err);
    return NextResponse.json({ error: 'Failed to build compliance snapshot' }, { status: 500 });
  }
}

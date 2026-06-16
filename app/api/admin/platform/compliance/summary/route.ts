/**
 * @fileoverview API route //api/admin/platform/compliance/summary
 * Location: /app/api/admin/platform/compliance/summary/route.ts
 */

/**
 * Compliance snapshot for platform admins (reporting)
 * GET /api/admin/platform/compliance/summary
 *
 * Response: { data: ComplianceSnapshot, meta: { regulatoryNotes: string } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { getComplianceSnapshot } from '@/lib/compliance/compliance-snapshot';
import { REGULATORY_PACK_FOLDER } from '@/lib/compliance/regulatory-context';
import { getNamibiaPaymentRailsSummary, labelForRailBucket } from '@/lib/payments/namibia-payment-rails';
import { getPaymentsByRailSince } from '@/lib/compliance/payments-by-rail';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withPlatformAdminAuth(request, async (req) => {
  try {
    const daysRaw = parseInt(req!.nextUrl.searchParams.get('paymentWindowDays') ?? '7', 10);
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
          'In-app reporting: KPIs + paymentsByRail (metadata.rail / payment_gateway). PDF pack under Downloads. Namibia card rail: Adumo Virtual (paymentRails.cardRail).',
      },
      meta: {
        regulatoryNotes:
          'KPIs map to Drizzle tables: support, consumer_rights_requests (ETA-oriented), cybersecurity_incidents (PSD-12 style), audit_trail, namqr_codes, ob_api_transactions, transactions. Cross-check PDFs in your compliance pack — not legal advice.',
        regulatoryPackFolder: REGULATORY_PACK_FOLDER,
      },
    });
  } catch (err) {
    securityLogger.error('[compliance/summary]', err);
    return NextResponse.json({ error: 'Failed to build compliance snapshot' }, { status: 500 });
  }
  });
}

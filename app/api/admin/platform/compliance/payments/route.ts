/**
 * @fileoverview API route //api/admin/platform/compliance/payments
 * Location: /app/api/admin/platform/compliance/payments/route.ts
 */

/**
 * Payments by rail — reporting (grouped transactions)
 * GET /api/admin/platform/compliance/payments?days=7
 *
 * Bucket = coalesce(metadata->>'rail', payment_gateway, 'unspecified')
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { getPaymentsByRailSince } from '@/lib/compliance/payments-by-rail';
import { db, generatedDocuments } from '@/lib/db';
import { gte, sql } from 'drizzle-orm';
import { labelForRailBucket } from '@/lib/payments/namibia-payment-rails';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withPlatformAdminAuth(request, async (req) => {
  try {
    const daysRaw = parseInt(req!.nextUrl.searchParams.get('days') ?? '7', 10);
    const days = Number.isNaN(daysRaw) || daysRaw < 1 ? 7 : Math.min(daysRaw, 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await getPaymentsByRailSince(since);
    const labeled = rows.map((r) => ({
      ...r,
      label: labelForRailBucket(r.bucket),
    }));

    const docStats = await db
      .select({
        documentType: generatedDocuments.documentType,
        count: sql<number>`count(*)::int`,
      })
      .from(generatedDocuments)
      .where(gte(generatedDocuments.generatedAt, since))
      .groupBy(generatedDocuments.documentType);

    return NextResponse.json({
      windowDays: days,
      since: since.toISOString(),
      currency: 'NAD',
      rows: labeled,
      guestFinancialDocuments: docStats,
    });
  } catch (err) {
    securityLogger.error('[compliance/payments]', err);
    return NextResponse.json({ error: 'Failed to aggregate payments' }, { status: 500 });
  }
  });
}

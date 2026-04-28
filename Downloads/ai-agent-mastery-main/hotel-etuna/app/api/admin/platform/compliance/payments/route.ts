/**
 * Payments by rail — reporting (grouped transactions)
 * GET /api/admin/platform/compliance/payments?days=7
 *
 * Bucket = coalesce(metadata->>'rail', payment_gateway, 'unspecified')
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';
import { getPaymentsByRailSince } from '@/lib/compliance/payments-by-rail';
import { enforcePlatformAdminRateLimit } from '@/lib/compliance/with-admin-rate-limit';
import { labelForRailBucket } from '@/lib/payments/namibia-payment-rails';

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

    const daysRaw = parseInt(request.nextUrl.searchParams.get('days') ?? '7', 10);
    const days = Number.isNaN(daysRaw) || daysRaw < 1 ? 7 : Math.min(daysRaw, 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await getPaymentsByRailSince(since);
    const labeled = rows.map((r) => ({
      ...r,
      label: labelForRailBucket(r.bucket),
    }));

    return NextResponse.json({
      windowDays: days,
      since: since.toISOString(),
      currency: 'NAD',
      rows: labeled,
    });
  } catch (err) {
    console.error('[compliance/payments]', err);
    return NextResponse.json({ error: 'Failed to aggregate payments' }, { status: 500 });
  }
}

/**
 * SOC 2 readiness audit (automated agents).
 * GET /api/admin/platform/compliance/soc2-audit?from=ISO&to=ISO
 *
 * Response: { data: Soc2AuditReport, meta: { type: 'readiness' | 'type1_prep' } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';
import { enforcePlatformAdminRateLimit } from '@/lib/compliance/with-admin-rate-limit';
import { runSoc2Audit } from '@/lib/compliance/soc2/soc2-audit-engine';
import { securityLogger } from '@/lib/utils/security-logger.client';

export const dynamic = 'force-dynamic';

function parseDate(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentPlatformAdmin();
    if (!user || !isPlatformAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limited = await enforcePlatformAdminRateLimit(request, user.id);
    if (limited) return limited;

    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const from = parseDate(request.nextUrl.searchParams.get('from'), defaultFrom);
    const to = parseDate(request.nextUrl.searchParams.get('to'), now);

    if (from > to) {
      return NextResponse.json({ error: 'from must be before to' }, { status: 400 });
    }

    const report = await runSoc2Audit({ from, to });

    return NextResponse.json({
      data: report,
      meta: {
        type: 'readiness',
        agentsDeployed: report.agents.map((a) => a.agentId),
        referencePdf:
          'LifeCompass/crawl4AI-agent-v2/nayaone_full_crawl/resources/d0b6bb4dde78c056.pdf',
      },
    });
  } catch (err) {
    securityLogger.error('[soc2-audit]', err);
    const isProd = process.env.NODE_ENV === 'production';
    return NextResponse.json(
      {
        error: 'SOC 2 audit failed',
        ...(isProd ? {} : { message: err instanceof Error ? err.message : 'Unknown' }),
      },
      { status: 500 }
    );
  }
}

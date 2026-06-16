/**
 * @fileoverview API route //api/admin/platform/compliance/soc2-audit
 * Location: /app/api/admin/platform/compliance/soc2-audit/route.ts
 */

/**
 * SOC 2 readiness audit (automated agents).
 * GET /api/admin/platform/compliance/soc2-audit?from=ISO&to=ISO
 *
 * Response: { data: Soc2AuditReport, meta: { type: 'readiness' | 'type1_prep' } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { runSoc2Audit } from '@/lib/compliance/soc2/soc2-audit-engine';
import { resolveSoc2PeriodFromSearchParams } from '@/lib/compliance/soc2/hub-compliance-access';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withPlatformAdminAuth(request, async (req) => {
    if (!req) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
    try {
      const period = resolveSoc2PeriodFromSearchParams(req.nextUrl.searchParams);
      if ('error' in period) {
        return NextResponse.json({ error: period.error }, { status: 400 });
      }

      const report = await runSoc2Audit({ from: period.from, to: period.to });

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
  });
}

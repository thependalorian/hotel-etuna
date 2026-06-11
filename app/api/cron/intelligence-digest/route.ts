/**
 * Intelligence digest cron — daily / weekly / monthly founder digests; Monday partner weekly.
 * GET /api/cron/intelligence-digest?cadence=daily|weekly|monthly|partner-weekly
 * Security: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  runIntelligenceDigestJob,
  type DigestJobCadence,
} from '@/lib/cron/intelligence-digest-job';
import { IntelligenceReportService } from '@/lib/services/platform/IntelligenceReportService';
import { securityLogger } from '@/lib/utils/security-logger';
import { cronUnauthorizedResponse, verifyCronRequest } from '@/lib/utils/cron-auth';

const ALLOWED: DigestJobCadence[] = ['daily', 'weekly', 'monthly', 'partner-weekly'];

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse();
  }

  const cadenceParam = new URL(request.url).searchParams.get('cadence') ?? 'daily';
  if (!ALLOWED.includes(cadenceParam as DigestJobCadence)) {
    return NextResponse.json(
      { error: `Invalid cadence. Use one of: ${ALLOWED.join(', ')}` },
      { status: 400 },
    );
  }

  const cadence = cadenceParam as DigestJobCadence;
  const sendEmail = new URL(request.url).searchParams.get('send') !== 'false';

  try {
    const svc = new IntelligenceReportService();
    const digest =
      cadence === 'partner-weekly'
        ? null
        : await svc.buildDigest(cadence as 'daily' | 'weekly' | 'monthly');

    const emailResult = await runIntelligenceDigestJob(cadence, { sendEmail });

    return NextResponse.json({
      ok: true,
      cadence,
      digest,
      email: emailResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    securityLogger.error('[cron/intelligence-digest]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Digest job failed' },
      { status: 500 },
    );
  }
}

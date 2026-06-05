/**
 * Platform intelligence digest preview + test send (Buffr admin only).
 * GET ?cadence=daily|weekly|monthly — preview JSON
 * POST ?cadence=...&send=true — send test email to founder list
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/platform-admin';
import {
  IntelligenceReportService,
  type DigestCadence,
} from '@/lib/services/platform/IntelligenceReportService';
import { runIntelligenceDigestJob } from '@/lib/cron/intelligence-digest-job';
import { securityLogger } from '@/lib/utils/security-logger';

const CADENCES: DigestCadence[] = ['daily', 'weekly', 'monthly'];

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin();
    const cadence = (new URL(request.url).searchParams.get('cadence') ?? 'daily') as DigestCadence;
    if (!CADENCES.includes(cadence)) {
      return NextResponse.json({ error: 'Invalid cadence' }, { status: 400 });
    }
    const digest = await new IntelligenceReportService().buildDigest(cadence);
    const plain = new IntelligenceReportService().formatDigestPlainText(digest);
    return NextResponse.json({ data: { digest, plainText: plain } });
  } catch (error) {
    securityLogger.error('[GET intelligence-digest]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin();
    const url = new URL(request.url);
    const cadence = (url.searchParams.get('cadence') ?? 'daily') as DigestCadence;
    if (!CADENCES.includes(cadence)) {
      return NextResponse.json({ error: 'Invalid cadence' }, { status: 400 });
    }
    const result = await runIntelligenceDigestJob(cadence, { sendEmail: true });
    return NextResponse.json({ data: result });
  } catch (error) {
    securityLogger.error('[POST intelligence-digest]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

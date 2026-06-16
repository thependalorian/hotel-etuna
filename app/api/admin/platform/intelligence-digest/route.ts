/**
 * @fileoverview API route //api/admin/platform/intelligence-digest
 * Location: /app/api/admin/platform/intelligence-digest/route.ts
 */

/**
 * Platform intelligence digest preview + test send (Buffr admin only).
 * GET ?cadence=daily|weekly|monthly — preview JSON
 * POST ?cadence=...&send=true — send test email to founder list
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import {
  IntelligenceReportService,
  type DigestCadence,
} from '@/lib/services/platform/IntelligenceReportService';
import { runIntelligenceDigestJob } from '@/lib/cron/intelligence-digest-job';
import { securityLogger } from '@/lib/utils/security-logger';

const CADENCES: DigestCadence[] = ['daily', 'weekly', 'monthly'];

export async function GET(request: NextRequest) {
  return withPlatformAdminAuth(request, async (req) => {
    try {
      const cadence = (new URL(req!.url).searchParams.get('cadence') ?? 'daily') as DigestCadence;
      if (!CADENCES.includes(cadence)) {
        return NextResponse.json({ error: 'Invalid cadence' }, { status: 400 });
      }
      const digest = await new IntelligenceReportService().buildDigest(cadence);
      const plain = new IntelligenceReportService().formatDigestPlainText(digest);
      return NextResponse.json({ data: { digest, plainText: plain } });
    } catch (error) {
      securityLogger.error('[GET intelligence-digest]', error);
      return NextResponse.json({ error: 'Failed to build digest' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withPlatformAdminAuth(request, async (req) => {
    try {
      const url = new URL(req!.url);
      const cadence = (url.searchParams.get('cadence') ?? 'daily') as DigestCadence;
      if (!CADENCES.includes(cadence)) {
        return NextResponse.json({ error: 'Invalid cadence' }, { status: 400 });
      }
      const result = await runIntelligenceDigestJob(cadence, { sendEmail: true });
      return NextResponse.json({ data: result });
    } catch (error) {
      securityLogger.error('[POST intelligence-digest]', error);
      return NextResponse.json({ error: 'Failed to send digest' }, { status: 500 });
    }
  });
}

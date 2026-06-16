/**
 * @fileoverview API route //api/cron/retention-enforcement
 * Location: /app/api/cron/retention-enforcement/route.ts
 */

/**
 * Cron — data-retention enforcement.
 * Location: app/api/cron/retention-enforcement/route.ts
 *
 * Security: Authorization: Bearer ${CRON_SECRET}
 * Default is DRY-RUN (counts only, no changes). Pass ?dryRun=false to flag expired records
 * (status 'active' → 'expired') for deletion review. Never deletes guest data directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RetentionEnforcementService } from '@/lib/services/compliance/RetentionEnforcementService';
import { SofiaChatRetentionService } from '@/lib/services/compliance/SofiaChatRetentionService';
import { securityLogger } from '@/lib/utils/security-logger';
import { cronUnauthorizedResponse, verifyCronRequest } from '@/lib/utils/cron-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse();
  }

  // Safe default: dry-run unless explicitly disabled.
  const dryRun = new URL(request.url).searchParams.get('dryRun') !== 'false';

  try {
    const [recordRetention, sofiaChat] = await Promise.all([
      RetentionEnforcementService.enforce({ dryRun }),
      SofiaChatRetentionService.enforce({ dryRun }),
    ]);
    return NextResponse.json({ ok: true, recordRetention, sofiaChat });
  } catch (error) {
    securityLogger.error('[cron retention-enforcement]', error);
    return NextResponse.json({ error: 'Retention enforcement failed' }, { status: 500 });
  }
}

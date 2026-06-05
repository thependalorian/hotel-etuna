/**
 * Platform secrets status — configured flags only, no values.
 * GET /api/admin/platform/secrets-status
 */

import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/platform-admin';
import { SecretsStatusService } from '@/lib/services/platform/SecretsStatusService';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET() {
  try {
    await requirePlatformAdmin();
    const service = new SecretsStatusService();
    return NextResponse.json({
      data: {
        secrets: service.list(),
        missingRequired: service.missingRequired(),
      },
    });
  } catch (error) {
    securityLogger.error('[GET secrets-status]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

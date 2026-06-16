/**
 * @fileoverview API route //api/admin/platform/secrets-status
 * Location: /app/api/admin/platform/secrets-status/route.ts
 */

/**
 * Platform secrets status — configured flags only, no values.
 * GET /api/admin/platform/secrets-status
 */

import { NextResponse } from 'next/server';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { SecretsStatusService } from '@/lib/services/platform/SecretsStatusService';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET() {
  return withPlatformAdminAuth(null, async () => {
    try {
      const service = new SecretsStatusService();
      return NextResponse.json({
        data: {
          secrets: service.list(),
          missingRequired: service.missingRequired(),
        },
      });
    } catch (error) {
      securityLogger.error('[GET secrets-status]', error);
      return NextResponse.json({ error: 'Failed to load secrets status' }, { status: 500 });
    }
  }, { rateLimit: false });
}

/**
 * @fileoverview API route //api/auth/check-platform-admin
 * Location: /app/api/auth/check-platform-admin/route.ts
 */

/**
 * Platform admin session probe — used by /admin/platform layout client guard.
 * Location: app/api/auth/check-platform-admin/route.ts
 *
 * Response: { ok: true } when current session is a platform admin; 401/403 otherwise.
 */

import { getCurrentPlatformAdmin } from '@/lib/auth/platform-admin';
import { errorResponse, successResponse } from '@/lib/utils/api-helpers';

export async function GET() {
  try {
    const admin = await getCurrentPlatformAdmin();
    if (!admin) {
      return errorResponse('Forbidden', 403, 'FORBIDDEN');
    }
    return successResponse({ isPlatformAdmin: true });
  } catch {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
  }
}

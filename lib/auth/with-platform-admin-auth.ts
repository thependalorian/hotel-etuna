/**
 * withPlatformAdminAuth — shared guard for /api/admin/platform/** routes.
 * Location: lib/auth/with-platform-admin-auth.ts
 *
 * Centralises platform-admin session check, optional super-admin, and rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentPlatformAdmin,
  requirePlatformAdmin,
  requireSuperAdmin,
  type PlatformAdminUser,
} from '@/lib/auth/platform-admin';
import { enforcePlatformAdminRateLimit } from '@/lib/compliance/with-admin-rate-limit';
import { logUnauthorizedAccess } from '@/lib/utils/security-logger.server';
import { securityLogger } from '@/lib/utils/security-logger';

export type { PlatformAdminUser };

export type PlatformAdminAuthOptions = {
  /** Require super-admin role (default: platform admin is enough). */
  superAdmin?: boolean;
  /** Apply per-admin rate limit (default: true when request is provided). */
  rateLimit?: boolean;
};

async function resolvePlatformAdmin(options?: PlatformAdminAuthOptions): Promise<PlatformAdminUser> {
  if (options?.superAdmin) {
    return requireSuperAdmin();
  }
  return requirePlatformAdmin();
}

/**
 * Guard platform admin API handlers. Returns 403 when session is missing or insufficient.
 */
export async function withPlatformAdminAuth(
  request: NextRequest | null,
  handler: (request: NextRequest | null, admin: PlatformAdminUser) => Promise<NextResponse>,
  options?: PlatformAdminAuthOptions
): Promise<NextResponse> {
  try {
    const admin = await resolvePlatformAdmin(options);

    const shouldRateLimit = options?.rateLimit ?? request !== null;
    if (shouldRateLimit && request) {
      const limited = await enforcePlatformAdminRateLimit(request, admin.id);
      if (limited) {
        return limited;
      }
    }

    return await handler(request, admin);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    if (message.includes('Unauthorized')) {
      if (request) {
        await logUnauthorizedAccess(request, 'Platform admin required');
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    securityLogger.error('[withPlatformAdminAuth]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Non-throwing check for routes that need admin context without the wrapper. */
export async function getPlatformAdminOrNull(): Promise<PlatformAdminUser | null> {
  return getCurrentPlatformAdmin();
}

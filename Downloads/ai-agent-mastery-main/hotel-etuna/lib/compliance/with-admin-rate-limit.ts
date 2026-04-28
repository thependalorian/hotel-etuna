/**
 * Rate limit helper for platform admin JSON routes
 * Location: lib/compliance/with-admin-rate-limit.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { rateLimitResponse } from '@/lib/utils/api-helpers';

export async function enforcePlatformAdminRateLimit(
  request: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, userId);
  if (result.allowed) {
    return null;
  }

  return rateLimitResponse(result);
}

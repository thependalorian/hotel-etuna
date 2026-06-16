/**
 * @fileoverview API route //api/guest/magic-link/verify
 * Location: /app/api/guest/magic-link/verify/route.ts
 */

/**
 * POST /api/guest/magic-link/verify — consume pre-arrival token, return stay redirect.
 * Location: app/api/guest/magic-link/verify/route.ts
 *
 * Response: { data: { bookingId, redirectUrl } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { GuestHubMagicLinkService } from '@/lib/services/guest/GuestHubMagicLinkService';
import { errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';

const bodySchema = z.object({
  token: z.string().min(16).max(512),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Invalid token', 400, 'VALIDATION_ERROR');
  }

  try {
    const service = new GuestHubMagicLinkService();
    const { bookingId } = await service.verifyAndConsume(parsed.data.token);
    const redirectUrl = `/guest/stays/${bookingId}`;
    return successResponse({ bookingId, redirectUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    securityLogger.warn('[magic-link/verify]', { message });
    const status =
      error instanceof AppError
        ? error.statusCode
        : message.includes('expired') || message.includes('used')
          ? 410
          : 404;
    return errorResponse(message, status, 'MAGIC_LINK_INVALID');
  }
}

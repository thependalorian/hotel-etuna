/**
 * @fileoverview API route //api/payments/open-banking/authorize
 * Location: /app/api/payments/open-banking/authorize/route.ts
 */

/**
 * Guest Open Banking — start bank OAuth / deep-link authorization.
 * Location: app/api/payments/open-banking/authorize/route.ts
 *
 * POST body: { bookingId, amount, returnUrl? }
 * Response: { data: { authorizationUrl } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { entityId } from '@/lib/validation/entity-ids';
import { buildGuestOpenBankingAuthorizeUrl } from '@/lib/payments/guest-open-banking-oauth';

const bodySchema = z.object({
  bookingId: entityId(),
  amount: z.number().positive().max(1_000_000),
  returnUrl: z.string().url().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req, user) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten());
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl =
      parsed.data.returnUrl ??
      `${appUrl}/payment/open-banking/return?bookingId=${parsed.data.bookingId}`;

    const authorizationUrl = buildGuestOpenBankingAuthorizeUrl({
      bookingId: parsed.data.bookingId,
      amount: parsed.data.amount,
      userId: user.id,
      returnUrl,
    });

    if (!authorizationUrl) {
      return errorResponse(
        'Bank payment redirect is not configured for this environment. Use card instead.',
        503,
        'OPEN_BANKING_NOT_CONFIGURED',
      );
    }

    return successResponse({ authorizationUrl });
  });
}

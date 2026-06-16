/**
 * @fileoverview API route //api/cron/payment-outbox-dispatch
 * Location: /app/api/cron/payment-outbox-dispatch/route.ts
 */

/**
 * Payment outbox dispatch cron — delivers queued payment side effects.
 *
 * Location: app/api/cron/payment-outbox-dispatch/route.ts
 * Security: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPaymentOutboxDispatch } from '@/lib/services/payment/paymentOutbox';
import { securityLogger } from '@/lib/utils/security-logger';
import { cronUnauthorizedResponse, verifyCronRequest } from '@/lib/utils/cron-auth';

/** Vercel Cron — dispatch pending payment outbox events */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse();
  }

  try {
    const result = await runPaymentOutboxDispatch(25);
    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    securityLogger.error('[cron/payment-outbox-dispatch]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Outbox dispatch failed' },
      { status: 500 },
    );
  }
}

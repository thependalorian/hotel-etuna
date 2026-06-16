/**
 * @fileoverview API route //api/webhooks/cal
 * Location: /app/api/webhooks/cal/route.ts
 */

/**
 * Cal.com webhook — booking mirror upserts with HMAC verification.
 *
 * POST /api/webhooks/cal
 * Header: x-cal-signature-256
 * Location: app/api/webhooks/cal/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calWebhookService,
  type CalWebhookBody,
} from '@/lib/services/scheduling/CalWebhookService';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-cal-signature-256');

  if (!calWebhookService.verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: CalWebhookBody;
  try {
    body = JSON.parse(rawBody) as CalWebhookBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const triggerEvent = body.triggerEvent ?? '';
  const payload = (body.payload ?? body) as Record<string, unknown>;

  if (!triggerEvent) {
    return NextResponse.json({ error: 'Missing triggerEvent' }, { status: 400 });
  }

  try {
    const result = await calWebhookService.handleWebhook(triggerEvent, payload);
    return NextResponse.json({ received: true, ...result }, { status: 200 });
  } catch (error) {
    securityLogger.error('[Cal webhook]', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

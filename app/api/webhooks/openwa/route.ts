/**
 * @fileoverview API route //api/webhooks/openwa
 * Location: /app/api/webhooks/openwa/route.ts
 */

/**
 * OpenWA webhook — inbound WhatsApp messages for Sofia (Railway sidecar).
 *
 * Purpose: Verify HMAC, route by sessionId → tenant, reply via OpenWA REST API.
 * Location: /app/api/webhooks/openwa/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyOpenWaWebhookSignature } from '@/lib/integrations/whatsapp/openwa-webhook-signature';
import { sendOpenWaTextMessage } from '@/lib/integrations/whatsapp/openwa-client';
import { fromOpenWaChatId } from '@/lib/integrations/whatsapp/openwa-phone';
import { processWhatsappInboundForSofia } from '@/lib/services/whatsapp/processWhatsappInboundForSofia';
import {
  getTenantWhatsappByOpenwaSessionId,
  resolveOpenWaApiBaseUrl,
  resolveOpenWaApiKey,
} from '@/lib/services/whatsapp/tenantWhatsappLookup';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

type OpenWaMessageReceivedData = {
  id?: string;
  from?: string;
  to?: string;
  body?: string;
  type?: string;
  fromMe?: boolean;
  isGroup?: boolean;
  hasMedia?: boolean;
};

type OpenWaWebhookPayload = {
  event?: string;
  timestamp?: string;
  sessionId?: string;
  deliveryId?: string;
  idempotencyKey?: string;
  signature?: string;
  data?: OpenWaMessageReceivedData;
};

function isOpenWaEnabled(): boolean {
  return process.env.OPENWA_ENABLED === 'true' || process.env.OPENWA_ENABLED === '1';
}

export async function POST(request: NextRequest) {
  if (!isOpenWaEnabled()) {
    return new NextResponse('OpenWA disabled', { status: 503 });
  }

  const rawBody = await request.text();

  const rate = await checkRateLimit(request);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: Math.ceil((rate.resetAt - Date.now()) / 1000) },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  let payload: OpenWaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as OpenWaWebhookPayload;
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  if (payload.event !== 'message.received') {
    return new NextResponse('OK', { status: 200 });
  }

  const sessionId = payload.sessionId?.trim();
  if (!sessionId) {
    securityLogger.warn('[openwa-webhook] missing sessionId');
    return new NextResponse('OK', { status: 200 });
  }

  const routing = await getTenantWhatsappByOpenwaSessionId(sessionId);
  if (!routing) {
    securityLogger.warn('[openwa-webhook] unmapped sessionId');
    return new NextResponse('OK', { status: 200 });
  }

  const webhookSecret =
    routing.openwaWebhookSecret?.trim() || process.env.OPENWA_WEBHOOK_SECRET?.trim() || '';

  if (webhookSecret) {
    const sigHeader =
      request.headers.get('x-openwa-signature') ?? payload.signature ?? null;
    if (!verifyOpenWaWebhookSignature(payload, sigHeader, webhookSecret)) {
      securityLogger.error('[openwa-webhook] Invalid signature');
      return new NextResponse('Unauthorized', { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    securityLogger.error('[openwa-webhook] webhook secret required in production');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const data = payload.data;
  if (!data?.from || data.fromMe || data.isGroup) {
    return new NextResponse('OK', { status: 200 });
  }

  if (data.type !== 'chat' && data.type !== 'text') {
    return new NextResponse('OK', { status: 200 });
  }

  const text = data.body?.trim();
  if (!text) {
    return new NextResponse('OK', { status: 200 });
  }

  const guestPhone = fromOpenWaChatId(data.from);
  const apiBaseUrl = resolveOpenWaApiBaseUrl(routing);
  const apiKey = resolveOpenWaApiKey();

  if (!apiBaseUrl || !apiKey) {
    securityLogger.error('[openwa-webhook] missing OPENWA_API_URL or OPENWA_API_KEY');
    return new NextResponse('OK', { status: 200 });
  }

  try {
    const { responseText } = await processWhatsappInboundForSofia({
      tenantId: routing.tenantId,
      defaultPropertyId: routing.defaultPropertyId,
      guestPhone,
      text,
      provider: 'openwa',
    });

    const sendResult = await sendOpenWaTextMessage({
      to: data.from,
      text: responseText,
      sessionId: routing.openwaSessionId ?? sessionId,
      apiBaseUrl,
      apiKey,
    });

    if (!sendResult.ok) {
      securityLogger.error('[openwa-webhook] send failed', {
        status: sendResult.status,
        body: sendResult.body,
      });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    securityLogger.error('[openwa-webhook] handler error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

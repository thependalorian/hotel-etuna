/**
 * WhatsApp Cloud API webhook — verification (GET) and inbound messages (POST).
 *
 * Purpose: Meta callback URL for Sofia; routes by phone_number_id → tenant via tenant_whatsapp_settings.
 * Location: /app/api/webhooks/whatsapp/route.ts
 *
 * Configure in Meta: Callback URL `https://<host>/api/webhooks/whatsapp`, verify token = WHATSAPP_VERIFY_TOKEN.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processSofiaConciergeMessage } from '@/lib/services/ai/sofia-concierge-handler';
import { verifyMetaWebhookSignature } from '@/lib/integrations/whatsapp/meta-webhook-signature';
import { sendWhatsAppTextMessage } from '@/lib/integrations/whatsapp/whatsapp-graph-api';
import { getTenantWhatsappByPhoneNumberId } from '@/lib/services/whatsapp/tenantWhatsappLookup';
import { findGuestIdByWhatsappPhone } from '@/lib/services/whatsapp/findGuestByWhatsappPhone';
import { checkRateLimit } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

type WhatsappWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        messages?: Array<{
          from?: string;
          type?: string;
          text?: { body?: string };
          id?: string;
        }>;
        statuses?: Array<Record<string, unknown>>;
      };
    }>;
  }>;
};

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const appSecret = process.env.META_APP_SECRET;

  if (appSecret) {
    const sig = request.headers.get('x-hub-signature-256');
    if (!verifyMetaWebhookSignature(rawBody, sig, appSecret)) {
      console.error('[whatsapp-webhook] Invalid X-Hub-Signature-256');
      return new NextResponse('Unauthorized', { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('[whatsapp-webhook] META_APP_SECRET is required in production');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

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

  let payload: WhatsappWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WhatsappWebhookPayload;
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  try {
    const value = payload.entry?.[0]?.changes?.[0]?.value;
    if (!value) {
      return new NextResponse('OK', { status: 200 });
    }

    if (value.statuses?.length && !value.messages?.length) {
      return new NextResponse('OK', { status: 200 });
    }

    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) {
      console.warn('[whatsapp-webhook] missing metadata.phone_number_id');
      return new NextResponse('OK', { status: 200 });
    }

    const routing = await getTenantWhatsappByPhoneNumberId(phoneNumberId);
    if (!routing) {
      console.warn('[whatsapp-webhook] unmapped phone_number_id', phoneNumberId);
      return new NextResponse('OK', { status: 200 });
    }

    const message = value.messages?.[0];
    if (!message?.from) {
      return new NextResponse('OK', { status: 200 });
    }

    if (message.type !== 'text' || !message.text?.body) {
      // Phase 1: text only; ack other types without error.
      return new NextResponse('OK', { status: 200 });
    }

    const accessToken =
      (routing.accessToken && routing.accessToken.trim()) ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      '';
    if (!accessToken) {
      console.error('[whatsapp-webhook] missing access token (row or WHATSAPP_ACCESS_TOKEN)');
      return new NextResponse('OK', { status: 200 });
    }

    const waFrom = message.from;
    const sessionId = `wa:${routing.tenantId}:${waFrom}`;
    const guestId = await findGuestIdByWhatsappPhone(routing.tenantId, waFrom);

    const aiResponse = await processSofiaConciergeMessage(
      {
        message: message.text.body,
        sessionId,
        tenantId: routing.tenantId,
        propertyId: routing.defaultPropertyId ?? undefined,
        guestId,
        language: 'en',
        channel: 'WHATSAPP',
      },
      'guest'
    );

    const sendResult = await sendWhatsAppTextMessage({
      to: waFrom,
      text: aiResponse.response,
      phoneNumberId,
      accessToken,
    });

    if (!sendResult.ok) {
      console.error(
        '[whatsapp-webhook] Graph API send failed',
        sendResult.status,
        sendResult.body
      );
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[whatsapp-webhook] handler error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

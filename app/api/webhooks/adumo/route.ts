/**
 * Adumo Online Virtual — server notification (notificationURL in JWT).
 * Location: app/api/webhooks/adumo/route.ts
 *
 * Validates JWT in payload, idempotently completes payment_sessions → booking/folio.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdumoVirtualService } from '@/lib/services/payment/AdumoVirtualService';
import { completeAdumoVirtualPayment } from '@/lib/services/payment/completeAdumoVirtualPayment';
import { securityLogger } from '@/lib/utils/security-logger.client';

export const dynamic = 'force-dynamic';

type AdumoWebhookBody = {
  token?: string;
  merchantReference?: string;
  mref?: string;
  transactionId?: string;
  transactionIndex?: string;
  status?: string;
  amount?: string | number;
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-adumo-signature');

  if (!AdumoVirtualService.verifyWebhookHmac(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: AdumoWebhookBody;
  try {
    payload = JSON.parse(rawBody) as AdumoWebhookBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const responseToken = payload.token;
  if (!responseToken) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const decoded = AdumoVirtualService.verifyResponseToken(responseToken);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const merchantReference =
    payload.merchantReference ?? payload.mref ?? decoded.mref;
  const transactionIndex =
    payload.transactionIndex ??
    payload.transactionId ??
    decoded.transactionIndex ??
    merchantReference;

  try {
    await completeAdumoVirtualPayment({
      merchantReference,
      transactionIndex,
      decoded,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    securityLogger.error('[Adumo webhook]', error);
    if (!AdumoVirtualService.isPaymentSuccess(decoded.result)) {
      return NextResponse.json({ received: true, declined: true }, { status: 200 });
    }
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

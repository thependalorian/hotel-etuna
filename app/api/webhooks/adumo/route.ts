/**
 * Adumo Online Virtual — server notification (notificationURL in JWT).
 * Location: app/api/webhooks/adumo/route.ts
 *
 * Validates JWT in payload, idempotently completes payment_sessions → booking/folio.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { paymentSessions } from '@/lib/db/schema';
import { AdumoVirtualService } from '@/lib/services/payment/AdumoVirtualService';
import { completeAdumoVirtualPayment } from '@/lib/services/payment/completeAdumoVirtualPayment';
import { PaymentDisputeService } from '@/lib/services/payment/PaymentDisputeService';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

/** Adumo post-settlement reversal/chargeback notification statuses. */
const REVERSAL_STATUSES = new Set(['REVERSED', 'REFUNDED', 'CHARGEBACK', 'CHARGED_BACK']);

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

  // Post-settlement reversal / chargeback: open a dispute (reverses the folio) instead of
  // re-completing the payment. Requires a known session for tenant/booking context.
  if (payload.status && REVERSAL_STATUSES.has(payload.status.toUpperCase())) {
    try {
      const [session] = await db
        .select()
        .from(paymentSessions)
        .where(eq(paymentSessions.merchantReference, merchantReference))
        .limit(1);

      if (!session) {
        securityLogger.warn('[Adumo webhook] reversal for unknown session', { merchantReference });
        return NextResponse.json({ received: true, ignored: 'unknown_session' }, { status: 200 });
      }

      const kind = payload.status.toUpperCase() === 'REFUNDED' ? 'refund' : 'chargeback';
      const result = await PaymentDisputeService.openDispute({
        tenantId: session.tenantId,
        bookingId: session.bookingId,
        merchantReference,
        gatewayTransactionId: transactionIndex,
        amount: Number.parseFloat(String(payload.amount ?? decoded.amount ?? session.amount)),
        currency: 'NAD',
        kind,
        reasonCode: payload.status.toUpperCase(),
        reason: `Adumo ${payload.status} notification`,
        metadata: { source: 'adumo_webhook' },
      });
      return NextResponse.json({ received: true, dispute: result.id }, { status: 200 });
    } catch (error) {
      securityLogger.error('[Adumo webhook reversal]', error);
      return NextResponse.json({ error: 'Reversal processing failed' }, { status: 500 });
    }
  }

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

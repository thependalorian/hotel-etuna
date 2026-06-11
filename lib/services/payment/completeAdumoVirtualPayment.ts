/**
 * Finalise Adumo Virtual payment — shared by redirect confirm + webhook.
 * Location: lib/services/payment/completeAdumoVirtualPayment.ts
 */

import { db } from '@/lib/db';
import {
  bookings,
  paymentSessions,
  transactions,
  bookingCharges,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { FolioService } from '@/lib/services/folio/FolioService';
import { AppError } from '@/lib/utils/errors';
import {
  AdumoVirtualService,
  type AdumoVirtualDecodedToken,
} from '@/lib/services/payment/AdumoVirtualService';
import { adumoConfig } from '@/lib/config/adumo';
import { PlatformFeeService } from '@/lib/services/billing/PlatformFeeService';
import { PlatformBillingService } from '@/lib/services/billing/PlatformBillingService';
import { applyDiningAdumoDeposit } from '@/lib/services/payment/applyDiningAdumoDeposit';
import {
  enqueuePaymentOutboxEvent,
  PAYMENT_OUTBOX_EVENT_TYPES,
  runPaymentOutboxDispatch,
} from '@/lib/services/payment/paymentOutbox';
import { securityLogger } from '@/lib/utils/security-logger';
import { assertPaymentSessionTransition } from '@/lib/services/payment/paymentStateMachine';

const folioService = new FolioService();

export interface CompleteAdumoVirtualInput {
  merchantReference: string;
  transactionIndex: string;
  decoded: AdumoVirtualDecodedToken;
}

export async function completeAdumoVirtualPayment(
  input: CompleteAdumoVirtualInput
): Promise<{
  bookingId?: string;
  diningReservationId?: string;
  alreadyProcessed: boolean;
}> {
  if (!AdumoVirtualService.isPaymentSuccess(input.decoded.result)) {
    const [failedSession] = await db
      .select()
      .from(paymentSessions)
      .where(eq(paymentSessions.merchantReference, input.merchantReference))
      .limit(1);

    if (failedSession && failedSession.status !== 'failed') {
      assertPaymentSessionTransition(
        failedSession.status,
        Boolean(failedSession.adumoTransactionIndex),
        'failed',
      );
      await db
        .update(paymentSessions)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(paymentSessions.id, failedSession.id));
    }

    throw new AppError(402, 'Card payment was declined or failed');
  }

  const [session] = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.merchantReference, input.merchantReference))
    .limit(1);

  if (!session) {
    throw new AppError(404, 'Payment session not found');
  }

  if (session.status === 'success') {
    return {
      bookingId: session.bookingId ?? undefined,
      diningReservationId: session.diningReservationId ?? undefined,
      alreadyProcessed: true,
    };
  }

  if (session.status !== 'pending') {
    throw new AppError(409, 'Payment session is no longer pending');
  }

  const sessionAmount = Number.parseFloat(String(session.amount));
  const paidAmount = Number.parseFloat(input.decoded.amount);
  if (
    Number.isFinite(paidAmount) &&
    Math.abs(paidAmount - sessionAmount) > 0.005
  ) {
    throw new AppError(400, 'Paid amount does not match session amount');
  }

  const gatewayId = input.transactionIndex || input.decoded.transactionIndex || input.merchantReference;

  const feeCtx = {
    grossAmount: sessionAmount,
    currency: adumoConfig.currencyCode,
    purpose: session.purpose as 'booking_deposit' | 'folio_settle' | 'dining_deposit',
    merchantReference: session.merchantReference,
    gatewayTransactionId: gatewayId,
    tenantId: session.tenantId,
    bookingId: session.bookingId,
  };
  const billing = new PlatformBillingService();
  const schedule = await billing.getFeeSchedule(session.tenantId);
  const commercial = PlatformFeeService.accrueCardProcessingFee(feeCtx, schedule);
  await billing.recordCardFeeAccrual(commercial, feeCtx);

  let completedTransactionId: string | undefined;

  if (session.purpose === 'dining_deposit') {
    await applyDiningAdumoDeposit(session, gatewayId, sessionAmount, commercial.metadata);
  } else if (session.purpose === 'folio_settle') {
    if (!session.bookingId) {
      throw new AppError(400, 'Folio payment requires a booking');
    }
    const settlement = await folioService.settleFolio(session.bookingId, {
      paymentMethod: 'card',
      amountPaid: sessionAmount,
      gatewayTransactionId: gatewayId,
      paymentMetadata: commercial.metadata,
    });
    completedTransactionId = settlement.transactionId;
  } else {
    if (!session.bookingId) {
      throw new AppError(400, 'Booking deposit requires a booking');
    }
    completedTransactionId = await applyBookingDeposit(
      session,
      gatewayId,
      sessionAmount,
      commercial.metadata
    );
  }

  assertPaymentSessionTransition(
    session.status,
    Boolean(session.adumoTransactionIndex || gatewayId),
    'success',
  );

  let receiptOutboxPayload:
    | {
        tenantId: string;
        bookingId: string;
        guestId: string;
        propertyId: string | null;
        amount: number;
        currency: string;
        paymentMethod: string;
        bookingReference?: string;
        transactionId?: string;
      }
    | undefined;

  if (session.bookingId) {
    const [bookingRow] = await db
      .select({
        guestId: bookings.guestId,
        propertyId: bookings.propertyId,
        bookingReference: bookings.bookingReference,
      })
      .from(bookings)
      .where(eq(bookings.id, session.bookingId))
      .limit(1);

    if (bookingRow?.guestId) {
      receiptOutboxPayload = {
        tenantId: session.tenantId,
        bookingId: session.bookingId,
        guestId: bookingRow.guestId,
        propertyId: bookingRow.propertyId,
        amount: sessionAmount,
        currency: adumoConfig.currencyCode,
        paymentMethod: 'card (Adumo)',
        bookingReference: bookingRow.bookingReference ?? undefined,
        transactionId: completedTransactionId,
      };
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(paymentSessions)
      .set({
        status: 'success',
        adumoTransactionIndex: gatewayId,
        updatedAt: new Date(),
      })
      .where(eq(paymentSessions.id, session.id));

    if (receiptOutboxPayload) {
      await enqueuePaymentOutboxEvent(
        {
          tenantId: session.tenantId,
          aggregateId: session.id,
          idempotencyKey: `payment_receipt:${session.id}`,
          eventType: PAYMENT_OUTBOX_EVENT_TYPES.PAYMENT_RECEIPT_EMAIL,
          payload: receiptOutboxPayload,
        },
        tx,
      );
    }
  });

  if (receiptOutboxPayload) {
    void runPaymentOutboxDispatch(1).catch((err) =>
      securityLogger.error('[completeAdumoVirtualPayment] outbox dispatch', err),
    );
  }

  return {
    bookingId: session.bookingId ?? undefined,
    diningReservationId: session.diningReservationId ?? undefined,
    alreadyProcessed: false,
  };
}

async function applyBookingDeposit(
  session: typeof paymentSessions.$inferSelect,
  gatewayId: string,
  amount: number,
  paymentMetadata: Record<string, unknown>
): Promise<string | undefined> {
  const bookingId = session.bookingId;
  if (!bookingId) {
    throw new AppError(400, 'Booking deposit session missing booking_id');
  }

  const now = new Date();
  const txRef = `ADU-${gatewayId.slice(0, 24)}`;

  let transactionId: string | undefined;

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        paymentStatus: 'paid',
        paymentMethod: 'card',
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId));

    const [txn] = await tx
      .insert(transactions)
      .values({
        tenantId: session.tenantId,
        bookingId,
        transactionReference: txRef,
        type: 'booking_payment',
        amount: amount.toFixed(2),
        currency: adumoConfig.currencyCode,
        status: 'completed',
        paymentGateway: 'adumo_virtual',
        gatewayTransactionId: gatewayId,
        description: `Booking deposit via Adumo Virtual (${session.merchantReference})`,
        metadata: {
          merchantReference: session.merchantReference,
          ...paymentMetadata,
        },
        processedAt: now,
      })
      .returning({ id: transactions.id });

    transactionId = txn?.id;

    await tx.insert(bookingCharges).values({
      tenantId: session.tenantId,
      bookingId,
      chargeType: 'payment',
      description: 'Card deposit (Adumo Virtual)',
      amount: (-amount).toFixed(2),
      currency: adumoConfig.currencyCode,
      status: 'settled',
      settledAt: now,
    });
  });

  return transactionId;
}

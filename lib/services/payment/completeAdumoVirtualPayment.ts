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
import { schedulePaymentReceiptEmail } from '@/lib/services/booking/bookingLifecycleSideEffects';
import { applyDiningAdumoDeposit } from '@/lib/services/payment/applyDiningAdumoDeposit';

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
    await db
      .update(paymentSessions)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(paymentSessions.merchantReference, input.merchantReference));
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
    Math.abs(paidAmount - sessionAmount) > 0.02
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

  if (session.purpose === 'dining_deposit') {
    await applyDiningAdumoDeposit(session, gatewayId, sessionAmount, commercial.metadata);
  } else if (session.purpose === 'folio_settle') {
    if (!session.bookingId) {
      throw new AppError(400, 'Folio payment requires a booking');
    }
    await folioService.settleFolio(session.bookingId, {
      paymentMethod: 'card',
      amountPaid: sessionAmount,
      gatewayTransactionId: gatewayId,
      paymentMetadata: commercial.metadata,
    });
  } else {
    if (!session.bookingId) {
      throw new AppError(400, 'Booking deposit requires a booking');
    }
    await applyBookingDeposit(session, gatewayId, sessionAmount, commercial.metadata);
  }

  await db
    .update(paymentSessions)
    .set({
      status: 'success',
      adumoTransactionIndex: gatewayId,
      updatedAt: new Date(),
    })
    .where(eq(paymentSessions.id, session.id));

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
      schedulePaymentReceiptEmail({
        tenantId: session.tenantId,
        bookingId: session.bookingId,
        guestId: bookingRow.guestId,
        propertyId: bookingRow.propertyId,
        amount: sessionAmount,
        currency: adumoConfig.currencyCode,
        paymentMethod: 'card (Adumo)',
        bookingReference: bookingRow.bookingReference ?? undefined,
      });
    }
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
): Promise<void> {
  const bookingId = session.bookingId;
  if (!bookingId) {
    throw new AppError(400, 'Booking deposit session missing booking_id');
  }

  const now = new Date();
  const txRef = `ADU-${gatewayId.slice(0, 24)}`;

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        paymentStatus: 'paid',
        paymentMethod: 'card',
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId));

    await tx.insert(transactions).values({
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
    });

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
}

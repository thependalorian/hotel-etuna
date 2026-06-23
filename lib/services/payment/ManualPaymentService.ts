/**
 * @fileoverview ManualPaymentService — domain service module.
 * ManualPaymentService — record off-platform payments (EFT, e-wallet, bank deposit, cash).
 * Location: lib/services/payment/ManualPaymentService.ts
 */

import { db } from '@/lib/db';
import { bookings, transactions } from '@/lib/db/schema';
import { PaymentGatewayLabel, PaymentMethodType } from '@/lib/payments/namibia-payment-rails';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { schedulePaymentReceiptEmail } from '@/lib/services/booking/bookingLifecycleSideEffects';
import { settleOffPlatformFolio } from '@/lib/services/payment/settleOffPlatformFolio';
import { eq } from 'drizzle-orm';
import { AppError, handleServiceError } from '@/lib/utils/errors';

export type ManualPaymentRail = 'eft' | 'ewallet' | 'bank_deposit' | 'cash';

const RAIL_TO_GATEWAY: Record<ManualPaymentRail, string> = {
  eft: PaymentGatewayLabel.BANK_EFT,
  ewallet: PaymentGatewayLabel.EWALLET_AGGREGATOR,
  bank_deposit: PaymentGatewayLabel.BANK_EFT,
  cash: PaymentGatewayLabel.CASH_MANUAL,
};

const RAIL_TO_METHOD_TYPE: Record<ManualPaymentRail, string> = {
  eft: PaymentMethodType.EFT,
  ewallet: PaymentMethodType.EWALLET,
  bank_deposit: PaymentMethodType.BANK_DEPOSIT,
  cash: PaymentMethodType.CASH,
};

export type RecordManualPaymentInput = {
  bookingId: string;
  tenantId: string;
  staffUserId: string;
  amount: number;
  rail: ManualPaymentRail;
  bankReference: string;
  payerName?: string;
  notes?: string;
  receivedAt?: Date;
  /** Apply to folio (booking_charges) vs booking deposit only */
  applyToFolio?: boolean;
};

export class ManualPaymentService {
  async recordPayment(input: RecordManualPaymentInput) {
    try {
      if (input.amount <= 0) {
        throw new AppError(400, 'Amount must be positive');
      }
      if (!input.bankReference.trim()) {
        throw new AppError(400, 'Bank or wallet reference is required');
      }

      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.bookingId))
        .limit(1);

      if (!booking) {
        throw new AppError(404, 'Booking not found');
      }
      if (booking.tenantId !== input.tenantId) {
        throw new AppError(403, 'Booking does not belong to tenant');
      }

      const gateway = RAIL_TO_GATEWAY[input.rail];

      if (input.applyToFolio && input.rail !== 'cash') {
        const settlement = await settleOffPlatformFolio({
          bookingId: input.bookingId,
          amountPaid: input.amount,
          bankReference: input.bankReference,
          rail: input.rail,
          userId: input.staffUserId,
          extraMetadata: {
            methodType: RAIL_TO_METHOD_TYPE[input.rail],
            payerName: input.payerName ?? null,
            notes: input.notes ?? null,
          },
        });

        await recordAuditTrail({
          tenantId: input.tenantId,
          userId: input.staffUserId,
          action: 'manual_payment_recorded',
          resourceType: 'transaction',
          resourceId: settlement.transactionId ?? input.bookingId,
          newValues: {
            bookingId: input.bookingId,
            rail: input.rail,
            amount: input.amount,
            bankReference: input.bankReference,
            folioClosed: settlement.folioClosed,
          },
        });

        if (booking.guestId) {
          schedulePaymentReceiptEmail({
            tenantId: input.tenantId,
            bookingId: input.bookingId,
            guestId: booking.guestId,
            propertyId: booking.propertyId,
            amount: input.amount,
            currency: booking.currency ?? 'NAD',
            paymentMethod: input.rail.toUpperCase(),
            bookingReference: booking.bookingReference ?? undefined,
            transactionId: settlement.transactionId,
          });
        }

        return {
          transactionId: settlement.transactionId,
          transactionReference: settlement.transactionReference,
          paymentGateway: gateway,
          amountSettled: settlement.amountSettled,
          balanceRemaining: settlement.balanceRemaining,
          folioClosed: settlement.folioClosed,
        };
      }

      const now = input.receivedAt ?? new Date();
      const txRef = `MAN-${input.rail.toUpperCase()}-${Date.now()}`;

      const [result] = await db
        .insert(transactions)
        .values({
          tenantId: input.tenantId,
          bookingId: booking.id,
          guestId: booking.guestId,
          transactionReference: txRef,
          type: 'manual_inbound',
          amount: input.amount.toFixed(2),
          currency: booking.currency ?? 'NAD',
          status: 'completed',
          paymentGateway: gateway,
          gatewayTransactionId: input.bankReference.trim(),
          description: `Manual ${input.rail} payment (${input.bankReference.trim()})`,
          metadata: {
            rail: input.rail,
            methodType: RAIL_TO_METHOD_TYPE[input.rail],
            payerName: input.payerName ?? null,
            notes: input.notes ?? null,
            offPlatform: true,
          },
          processedAt: now,
        })
        .returning();

      if (!result) {
        throw new AppError(500, 'Failed to record payment');
      }

      await recordAuditTrail({
        tenantId: input.tenantId,
        userId: input.staffUserId,
        action: 'manual_payment_recorded',
        resourceType: 'transaction',
        resourceId: result.id,
        newValues: {
          bookingId: input.bookingId,
          rail: input.rail,
          amount: input.amount,
          bankReference: input.bankReference,
        },
      });

      if (booking.guestId) {
        schedulePaymentReceiptEmail({
          tenantId: input.tenantId,
          bookingId: input.bookingId,
          guestId: booking.guestId,
          propertyId: booking.propertyId,
          amount: input.amount,
          currency: booking.currency ?? 'NAD',
          paymentMethod: input.rail.toUpperCase(),
          bookingReference: booking.bookingReference ?? undefined,
          transactionId: result.id,
        });
      }

      return {
        transactionId: result.id,
        transactionReference: result.transactionReference,
        paymentGateway: gateway,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      return handleServiceError(error, 'Failed to record manual payment');
    }
  }
}

export const manualPaymentService = new ManualPaymentService();

/**
 * PaymentDisputeService — card chargebacks / refunds / reversals.
 * Location: lib/services/payment/PaymentDisputeService.ts
 *
 * Opening a dispute reverses the folio (reversing transaction + booking charge) so a chargeback
 * never silently desyncs the ledger. PSD-4 merchant-side dispute handling. Idempotent per
 * gateway transaction + kind.
 */

import { db } from '@/lib/db';
import {
  paymentDisputes,
  transactions,
  bookingCharges,
  bookings,
  auditTrail,
} from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

export type DisputeKind = 'chargeback' | 'refund' | 'reversal';
export type DisputeStatus =
  | 'opened'
  | 'under_review'
  | 'won'
  | 'lost'
  | 'refunded'
  | 'reversed';

export interface OpenDisputeInput {
  tenantId: string;
  amount: number;
  currency?: string;
  kind?: DisputeKind;
  bookingId?: string | null;
  transactionId?: string | null;
  guestId?: string | null;
  merchantReference?: string | null;
  gatewayTransactionId?: string | null;
  paymentGateway?: string;
  reasonCode?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  /** Acting user (webhook = system/null). */
  userId?: string | null;
}

export interface DisputeRecord {
  id: string;
  status: DisputeStatus;
  alreadyOpen: boolean;
}

export class PaymentDisputeService {
  /**
   * Open a dispute and reverse the folio. Idempotent: a non-terminal dispute already existing
   * for the same gateway transaction + kind is returned instead of duplicating.
   */
  static async openDispute(input: OpenDisputeInput): Promise<DisputeRecord> {
    const kind: DisputeKind = input.kind ?? 'chargeback';
    const currency = input.currency ?? 'NAD';

    // Idempotency on the gateway transaction (the chargeback identifier).
    if (input.gatewayTransactionId) {
      const [existing] = await db
        .select({ id: paymentDisputes.id, status: paymentDisputes.status })
        .from(paymentDisputes)
        .where(
          and(
            eq(paymentDisputes.tenantId, input.tenantId),
            eq(paymentDisputes.gatewayTransactionId, input.gatewayTransactionId),
            eq(paymentDisputes.kind, kind),
          ),
        )
        .limit(1);
      if (existing) {
        return { id: existing.id, status: existing.status as DisputeStatus, alreadyOpen: true };
      }
    }

    const disputeId = await db.transaction(async (tx) => {
      const [dispute] = await tx
        .insert(paymentDisputes)
        .values({
          tenantId: input.tenantId,
          bookingId: input.bookingId ?? null,
          transactionId: input.transactionId ?? null,
          guestId: input.guestId ?? null,
          merchantReference: input.merchantReference ?? null,
          gatewayTransactionId: input.gatewayTransactionId ?? null,
          paymentGateway: input.paymentGateway ?? 'adumo_virtual',
          kind,
          status: 'opened',
          amount: input.amount.toFixed(2),
          currency,
          reasonCode: input.reasonCode ?? null,
          reason: input.reason ?? null,
          metadata: input.metadata ?? null,
        })
        .returning({ id: paymentDisputes.id });

      // Reverse the folio for a booking: re-add the charge that the original payment had credited,
      // record a reversing transaction, and flag the booking as disputed.
      if (input.bookingId) {
        const ref = `CBK-${(input.gatewayTransactionId ?? dispute.id).slice(0, 24)}`;
        await tx.insert(transactions).values({
          tenantId: input.tenantId,
          bookingId: input.bookingId,
          guestId: input.guestId ?? null,
          transactionReference: ref,
          type: kind, // chargeback | refund | reversal
          amount: input.amount.toFixed(2),
          currency,
          status: 'completed',
          paymentGateway: input.paymentGateway ?? 'adumo_virtual',
          gatewayTransactionId: input.gatewayTransactionId ?? null,
          description: `${kind} reversal for ${input.merchantReference ?? input.bookingId}`,
          metadata: { disputeId: dispute.id, ...(input.metadata ?? {}) },
          processedAt: new Date(),
        });

        await tx.insert(bookingCharges).values({
          tenantId: input.tenantId,
          bookingId: input.bookingId,
          // booking_charge_type enum has no chargeback/refund value; an adjustment that
          // re-instates the amount owed is the correct ledger primitive. Precise kind is on
          // the transaction (`type`) and the payment_disputes row.
          chargeType: 'adjustment',
          description: `Card ${kind} (reverses prior payment)`,
          amount: input.amount.toFixed(2), // positive: re-instates the amount owed
          currency,
          status: 'settled',
          settledAt: new Date(),
        });

        await tx
          .update(bookings)
          .set({ paymentStatus: 'disputed', updatedAt: new Date() })
          .where(eq(bookings.id, input.bookingId));
      }

      await tx.insert(auditTrail).values({
        tenantId: input.tenantId,
        userId: input.userId ?? null,
        action: `payment.dispute.${kind}`,
        resourceType: 'payment_dispute',
        resourceId: dispute.id,
        newValues: {
          kind,
          amount: input.amount,
          bookingId: input.bookingId ?? null,
          gatewayTransactionId: input.gatewayTransactionId ?? null,
          reasonCode: input.reasonCode ?? null,
        },
      });

      return dispute.id;
    });

    securityLogger.warn('[PaymentDisputeService] dispute opened', {
      disputeId,
      kind,
      bookingId: input.bookingId ?? null,
      amount: input.amount,
    });

    return { id: disputeId, status: 'opened', alreadyOpen: false };
  }

  /** Resolve a dispute (won/lost/refunded/reversed). */
  static async resolveDispute(params: {
    id: string;
    tenantId: string;
    status: DisputeStatus;
    userId?: string | null;
    note?: string;
  }): Promise<boolean> {
    const [updated] = await db
      .update(paymentDisputes)
      .set({
        status: params.status,
        reason: params.note ?? undefined,
        resolvedAt: new Date(),
        resolvedBy: params.userId ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(paymentDisputes.id, params.id),
          eq(paymentDisputes.tenantId, params.tenantId),
        ),
      )
      .returning({ id: paymentDisputes.id });

    if (!updated) return false;

    await db.insert(auditTrail).values({
      tenantId: params.tenantId,
      userId: params.userId ?? null,
      action: `payment.dispute.resolved.${params.status}`,
      resourceType: 'payment_dispute',
      resourceId: params.id,
      newValues: { status: params.status, note: params.note ?? null },
    });

    return true;
  }

  /** List disputes for a tenant (newest first). */
  static async list(tenantId: string, status?: DisputeStatus) {
    const where = status
      ? and(eq(paymentDisputes.tenantId, tenantId), eq(paymentDisputes.status, status))
      : eq(paymentDisputes.tenantId, tenantId);
    return db
      .select()
      .from(paymentDisputes)
      .where(where)
      .orderBy(desc(paymentDisputes.openedAt))
      .limit(200);
  }
}

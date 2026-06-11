/**
 * Transactional outbox for payment side effects (receipt email, notifications).
 *
 * Purpose: Persist side effects atomically with payment state updates; dispatch via cron.
 * Location: lib/services/payment/paymentOutbox.ts
 */

import { db, paymentOutboxEvents, type PaymentOutboxEvent } from '@/lib/db';
import { schedulePaymentReceiptEmail } from '@/lib/services/booking/bookingLifecycleSideEffects';
import { securityLogger } from '@/lib/utils/security-logger';
import { and, eq, inArray, isNull, lt, lte, or } from 'drizzle-orm';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NeonQueryResultHKT } from 'drizzle-orm/neon-serverless';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type * as schema from '@/lib/db/schema';

export const PAYMENT_OUTBOX_EVENT_TYPES = {
  PAYMENT_RECEIPT_EMAIL: 'payment_receipt_email',
} as const;

export type PaymentOutboxEventType =
  (typeof PAYMENT_OUTBOX_EVENT_TYPES)[keyof typeof PAYMENT_OUTBOX_EVENT_TYPES];

export type PaymentReceiptEmailPayload = {
  tenantId: string;
  bookingId: string;
  guestId: string;
  propertyId: string | null;
  amount: number;
  currency?: string;
  paymentMethod: string;
  bookingReference?: string;
  transactionId?: string;
};

type DbClient =
  | typeof db
  | PgTransaction<
      NeonQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >;

const DEFAULT_MAX_ATTEMPTS = 10;
const BASE_RETRY_MS = 60_000;
const MAX_RETRY_MS = 3_600_000;

export interface EnqueuePaymentOutboxInput {
  tenantId: string;
  aggregateId: string;
  idempotencyKey: string;
  eventType: PaymentOutboxEventType;
  payload: PaymentReceiptEmailPayload | Record<string, unknown>;
  aggregateType?: string;
  maxAttempts?: number;
}

/**
 * Enqueue a payment side-effect row. Use inside the same DB transaction as state updates.
 */
export async function enqueuePaymentOutboxEvent(
  input: EnqueuePaymentOutboxInput,
  tx: DbClient = db,
): Promise<PaymentOutboxEvent | null> {
  const [inserted] = await tx
    .insert(paymentOutboxEvents)
    .values({
      tenantId: input.tenantId,
      idempotencyKey: input.idempotencyKey,
      aggregateType: input.aggregateType ?? 'payment_session',
      aggregateId: input.aggregateId,
      eventType: input.eventType,
      payload: input.payload,
      maxAttempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      status: 'pending',
    })
    .onConflictDoNothing({ target: paymentOutboxEvents.idempotencyKey })
    .returning();

  if (!inserted) {
    const [existing] = await tx
      .select()
      .from(paymentOutboxEvents)
      .where(eq(paymentOutboxEvents.idempotencyKey, input.idempotencyKey))
      .limit(1);
    return existing ?? null;
  }

  return inserted;
}

/**
 * Claim pending outbox rows for dispatch (oldest first, retry-aware).
 */
export async function dequeuePaymentOutboxEvents(limit = 25): Promise<PaymentOutboxEvent[]> {
  const now = new Date();

  return db.transaction(async (tx) => {
    const pending = await tx
      .select()
      .from(paymentOutboxEvents)
      .where(
        and(
          eq(paymentOutboxEvents.status, 'pending'),
          or(
            isNull(paymentOutboxEvents.nextAttemptAt),
            lte(paymentOutboxEvents.nextAttemptAt, now),
          ),
          lt(paymentOutboxEvents.attempts, paymentOutboxEvents.maxAttempts),
        ),
      )
      .orderBy(paymentOutboxEvents.createdAt)
      .limit(limit)
      .for('update', { skipLocked: true });

    if (!pending.length) {
      return [];
    }

    const ids = pending.map((row) => row.id);
    return tx
      .update(paymentOutboxEvents)
      .set({ status: 'processing', updatedAt: now })
      .where(inArray(paymentOutboxEvents.id, ids))
      .returning();
  });
}

function computeNextAttemptAt(attempts: number): Date {
  const delay = Math.min(BASE_RETRY_MS * 2 ** Math.max(attempts - 1, 0), MAX_RETRY_MS);
  return new Date(Date.now() + delay);
}

async function markOutboxCompleted(eventId: string): Promise<void> {
  const now = new Date();
  await db
    .update(paymentOutboxEvents)
    .set({
      status: 'completed',
      processedAt: now,
      updatedAt: now,
      lastError: null,
    })
    .where(eq(paymentOutboxEvents.id, eventId));
}

async function markOutboxFailed(event: PaymentOutboxEvent, errorMessage: string): Promise<void> {
  const attempts = event.attempts + 1;
  const permanent = attempts >= event.maxAttempts;
  const now = new Date();

  await db
    .update(paymentOutboxEvents)
    .set({
      status: permanent ? 'failed' : 'pending',
      attempts,
      lastError: errorMessage.slice(0, 2000),
      nextAttemptAt: permanent ? null : computeNextAttemptAt(attempts),
      updatedAt: now,
    })
    .where(eq(paymentOutboxEvents.id, event.id));

  if (permanent) {
    securityLogger.error('[paymentOutbox] permanently failed', {
      eventId: event.id,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      error: errorMessage,
    });
  }
}

function dispatchReceiptEmail(payload: PaymentReceiptEmailPayload): void {
  schedulePaymentReceiptEmail({
    tenantId: payload.tenantId,
    bookingId: payload.bookingId,
    guestId: payload.guestId,
    propertyId: payload.propertyId,
    amount: payload.amount,
    currency: payload.currency,
    paymentMethod: payload.paymentMethod,
    bookingReference: payload.bookingReference,
    transactionId: payload.transactionId,
  });
}

/**
 * Execute a single outbox side effect.
 */
export async function dispatchPaymentOutboxEvent(event: PaymentOutboxEvent): Promise<void> {
  try {
    switch (event.eventType) {
      case PAYMENT_OUTBOX_EVENT_TYPES.PAYMENT_RECEIPT_EMAIL: {
        const payload = event.payload as PaymentReceiptEmailPayload;
        if (!payload?.bookingId || !payload?.guestId || !payload?.tenantId) {
          throw new Error('Invalid payment_receipt_email payload');
        }
        dispatchReceiptEmail(payload);
        break;
      }
      default:
        throw new Error(`Unsupported payment outbox event type: ${event.eventType}`);
    }

    await markOutboxCompleted(event.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    securityLogger.error('[paymentOutbox] dispatch failed', {
      eventId: event.id,
      eventType: event.eventType,
      error: message,
    });
    await markOutboxFailed(event, message);
    throw error;
  }
}

export interface PaymentOutboxDispatchResult {
  claimed: number;
  completed: number;
  failed: number;
}

/** Cron/worker entry: claim and dispatch a batch of pending events. */
export async function runPaymentOutboxDispatch(
  batchSize = 25,
): Promise<PaymentOutboxDispatchResult> {
  const claimed = await dequeuePaymentOutboxEvents(batchSize);
  let completed = 0;
  let failed = 0;

  for (const event of claimed) {
    try {
      await dispatchPaymentOutboxEvent(event);
      completed += 1;
    } catch {
      failed += 1;
    }
  }

  if (claimed.length > 0) {
    securityLogger.info('[paymentOutbox] dispatch batch', {
      claimed: claimed.length,
      completed,
      failed,
    });
  }

  return { claimed: claimed.length, completed, failed };
}

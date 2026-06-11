/**
 * CalWebhookService — Cal.com webhook verification and booking mirror upserts.
 *
 * Purpose: Verify HMAC signatures and idempotently persist Cal.com booking events.
 * Pattern: buffr-host/source-codes/cal.com webhook handlers (study only).
 * Location: lib/services/scheduling/CalWebhookService.ts
 */

import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { calBookingMirrors } from '@/lib/db/schema';
import { securityLogger } from '@/lib/utils/security-logger';

export const CAL_WEBHOOK_TRIGGERS = [
  'BOOKING_CREATED',
  'BOOKING_CANCELLED',
  'BOOKING_RESCHEDULED',
  'BOOKING_PAID',
] as const;

export type CalWebhookTrigger = (typeof CAL_WEBHOOK_TRIGGERS)[number];

export type CalWebhookPayload = Record<string, unknown>;

export interface CalWebhookBody {
  triggerEvent?: string;
  payload?: CalWebhookPayload;
}

function mapTriggerToStatus(trigger: string): string {
  switch (trigger) {
    case 'BOOKING_CANCELLED':
      return 'cancelled';
    case 'BOOKING_RESCHEDULED':
      return 'rescheduled';
    case 'BOOKING_PAID':
      return 'paid';
    case 'BOOKING_CREATED':
    default:
      return 'active';
  }
}

function extractCalUid(payload: CalWebhookPayload): string | null {
  const uid = payload.uid ?? payload.bookingId ?? payload.id;
  if (uid == null || uid === '') {
    return null;
  }
  return String(uid);
}

function extractMetadata(payload: CalWebhookPayload): {
  propertyId?: string;
  bookingId?: string;
} {
  const metadata = (payload.metadata ?? {}) as Record<string, unknown>;
  const propertyId =
    metadata.propertyId != null ? String(metadata.propertyId) : undefined;
  const bookingId =
    metadata.bookingId != null
      ? String(metadata.bookingId)
      : metadata.buffrBookingId != null
        ? String(metadata.buffrBookingId)
        : undefined;
  return { propertyId, bookingId };
}

export class CalWebhookService {
  /**
   * Verify Cal.com webhook HMAC signature (x-cal-signature-256).
   */
  verifySignature(rawBody: string, signature: string | null): boolean {
    const secret = process.env.CAL_WEBHOOK_SECRET?.trim();
    if (!secret || !signature) {
      return false;
    }

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    try {
      const expectedBuf = Buffer.from(expected, 'utf8');
      const receivedBuf = Buffer.from(signature, 'utf8');
      if (expectedBuf.length !== receivedBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(expectedBuf, receivedBuf);
    } catch {
      return false;
    }
  }

  /**
   * Handle a verified Cal.com webhook — upsert cal_booking_mirrors by cal_uid.
   */
  async handleWebhook(
    triggerEvent: string,
    payload: CalWebhookPayload,
  ): Promise<{ ok: boolean; ignored?: boolean; calUid?: string }> {
    if (!CAL_WEBHOOK_TRIGGERS.includes(triggerEvent as CalWebhookTrigger)) {
      securityLogger.info('[CalWebhook] Ignored trigger', { triggerEvent });
      return { ok: true, ignored: true };
    }

    const calUid = extractCalUid(payload);
    if (!calUid) {
      throw new Error('Cal.com payload missing uid/bookingId');
    }

    const { propertyId, bookingId } = extractMetadata(payload);
    const status = mapTriggerToStatus(triggerEvent);
    const now = new Date();

    await db
      .insert(calBookingMirrors)
      .values({
        calUid,
        propertyId: propertyId ?? null,
        bookingId: bookingId ?? null,
        payload,
        status,
        webhookReceivedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: calBookingMirrors.calUid,
        set: {
          propertyId: propertyId ?? null,
          bookingId: bookingId ?? null,
          payload,
          status,
          webhookReceivedAt: now,
          updatedAt: now,
        },
      });

    securityLogger.info('[CalWebhook] Mirror upserted', {
      calUid,
      triggerEvent,
      status,
      propertyId,
      bookingId,
    });

    return { ok: true, calUid };
  }
}

export const calWebhookService = new CalWebhookService();

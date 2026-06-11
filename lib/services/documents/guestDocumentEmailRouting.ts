/**
 * Email / inbox routing for guest financial PDF requests (receipt, invoice, quotation).
 * Location: lib/services/documents/guestDocumentEmailRouting.ts
 */

import { db, bookings, properties } from '@/lib/db';
import { and, desc, eq } from 'drizzle-orm';
import type { FinancialDocumentType } from '@/lib/services/documents/document-types';
import { documentGenerationService } from '@/lib/services/documents/DocumentGenerationService';

const FINANCIAL_DOC_REQUEST =
  /\b(resend|send|email|copy of|need|want)\b.*\b(receipt|invoice|quotation|payment notification|tax invoice)\b/i;

export function isFinancialDocumentEmailRequest(message: string): boolean {
  return FINANCIAL_DOC_REQUEST.test(message);
}

function inferDocumentType(message: string): FinancialDocumentType {
  const lower = message.toLowerCase();
  if (lower.includes('invoice') || lower.includes('tax invoice')) return 'invoice';
  if (lower.includes('quotation') || lower.includes('quote')) return 'quotation';
  if (lower.includes('payment notification') || lower.includes('eft')) {
    return 'payment_notification';
  }
  return 'receipt';
}

export async function resolveLatestGuestBookingId(
  tenantId: string,
  guestId: string
): Promise<string | null> {
  const [row] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.tenantId, tenantId), eq(bookings.guestId, guestId)))
    .orderBy(desc(bookings.createdAt))
    .limit(1);
  return row?.id ?? null;
}

/**
 * When a guest emails asking for a financial PDF and we can resolve their booking,
 * queue generate-and-email and return a short staff-facing confirmation string.
 */
export async function tryFulfillGuestDocumentEmailRequest(input: {
  tenantId: string;
  guestId?: string | null;
  message: string;
}): Promise<{ fulfilled: boolean; replyText?: string }> {
  if (!input.guestId || !isFinancialDocumentEmailRequest(input.message)) {
    return { fulfilled: false };
  }

  const bookingId = await resolveLatestGuestBookingId(input.tenantId, input.guestId);
  if (!bookingId) {
    return {
      fulfilled: true,
      replyText:
        'We could not match your email to an active booking. Please reply with your booking reference or sign in to the guest hub to download your documents.',
    };
  }

  const [property] = await db
    .select({ ownerId: properties.ownerId })
    .from(properties)
    .where(eq(properties.tenantId, input.tenantId))
    .limit(1);

  const documentType = inferDocumentType(input.message);
  const generatedBy = property?.ownerId ?? input.guestId;

  await documentGenerationService.generateAndEmail({
    tenantId: input.tenantId,
    bookingId,
    documentType,
    generatedBy,
  });

  const label =
    documentType === 'payment_notification'
      ? 'payment notification'
      : documentType.replace('_', ' ');

  return {
    fulfilled: true,
    replyText: `We have emailed your ${label} PDF for booking ${bookingId.slice(0, 8)}…. If you do not see it within a few minutes, check spam or open Financial documents in your guest hub.`,
  };
}

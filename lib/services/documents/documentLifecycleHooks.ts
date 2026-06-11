/**
 * Auto PDF email hooks — quotation, receipt, payment notification, invoice.
 * Location: lib/services/documents/documentLifecycleHooks.ts
 */

import { db, properties } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { documentGenerationService } from '@/lib/services/documents/DocumentGenerationService';
import { isPaymentNotificationMethod } from '@/lib/services/documents/document-types';
import { securityLogger } from '@/lib/utils/security-logger';

function fire(fn: () => Promise<void>): void {
  void fn().catch((err) => securityLogger.error('[documentLifecycleHooks]', err));
}

async function resolveGeneratedBy(tenantId: string, propertyId: string | null): Promise<string | null> {
  if (!propertyId) return null;
  const [property] = await db
    .select({ ownerId: properties.ownerId })
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.tenantId, tenantId)))
    .limit(1);
  return property?.ownerId ?? null;
}

export function scheduleQuotationPdfEmail(input: {
  tenantId: string;
  bookingId: string;
  guestId: string;
  propertyId: string | null;
  paymentStatus: string | null | undefined;
  totalAmount: number;
}): void {
  if (input.paymentStatus !== 'pending' || input.totalAmount <= 0) return;

  fire(async () => {
    const generatedBy = (await resolveGeneratedBy(input.tenantId, input.propertyId)) ?? input.guestId;
    await documentGenerationService.generateAndEmail({
      tenantId: input.tenantId,
      bookingId: input.bookingId,
      documentType: 'quotation',
      generatedBy,
    });
  });
}

export function schedulePaymentDocumentEmails(input: {
  tenantId: string;
  bookingId: string;
  guestId: string;
  propertyId: string | null;
  transactionId: string;
  paymentMethod: string;
  amount: number;
}): void {
  fire(async () => {
    const generatedBy = (await resolveGeneratedBy(input.tenantId, input.propertyId)) ?? input.guestId;

    await documentGenerationService.generateAndEmail({
      tenantId: input.tenantId,
      bookingId: input.bookingId,
      documentType: 'receipt',
      generatedBy,
      transactionId: input.transactionId,
    });

    if (isPaymentNotificationMethod(input.paymentMethod)) {
      await documentGenerationService.generateAndEmail({
        tenantId: input.tenantId,
        bookingId: input.bookingId,
        documentType: 'payment_notification',
        generatedBy,
        transactionId: input.transactionId,
      });
    }
  });
}

export function scheduleInvoicePdfEmail(input: {
  tenantId: string;
  bookingId: string;
  guestId: string;
  propertyId: string | null;
}): void {
  fire(async () => {
    const generatedBy = (await resolveGeneratedBy(input.tenantId, input.propertyId)) ?? input.guestId;
    await documentGenerationService.generateAndEmail({
      tenantId: input.tenantId,
      bookingId: input.bookingId,
      documentType: 'invoice',
      generatedBy,
    });
  });
}

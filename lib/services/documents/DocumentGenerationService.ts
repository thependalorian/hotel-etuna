/**
 * Guest financial PDF orchestration — generate, log, email, re-render from metadata snapshot.
 * Location: lib/services/documents/DocumentGenerationService.ts
 *
 * RAG does not ingest PDF buffers — policies only (see RagIngestService).
 */

import { createHash } from 'node:crypto';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import {
  db,
  bookings,
  generatedDocuments,
  guests,
  properties,
  transactions,
} from '@/lib/db';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { FolioService } from '@/lib/services/folio/FolioService';
import {
  getHotelEtunaNamraRegistration,
  getHotelEtunaPropertyTaxProfile,
  sumDocumentLineTaxes,
} from '@/lib/platform/namibia-tax';
import {
  type DocumentMetadataSnapshot,
  type FinancialDocumentType,
  documentCampaignKey,
  documentEmailSubject,
  isPaymentNotificationMethod,
} from '@/lib/services/documents/document-types';
import { formatReferenceNumber, parseReferenceSequence } from '@/lib/services/documents/document-reference-generator';
import { renderDocumentPdfBuffer } from '@/lib/services/documents/render-document-pdf';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { CrmOutreachService } from '@/lib/services/crm/CrmOutreachService';
import { CrmGraphMemoryService } from '@/lib/services/crm/CrmGraphMemoryService';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { securityLogger } from '@/lib/utils/security-logger';
import { toNumber } from '@/lib/utils/money';

// Reason: FolioService imports documentLifecycleHooks -> DocumentGenerationService, forming an
// import cycle. Instantiating FolioService at module-eval time throws "FolioService is not a
// constructor" because the class binding is not yet assigned mid-cycle. Lazy-init defers
// construction to call-time, when the cyclic binding is fully resolved.
let _folioService: FolioService | null = null;
function getFolioService(): FolioService {
  if (!_folioService) _folioService = new FolioService();
  return _folioService;
}
const emailService = new EmailService();
const outreach = new CrmOutreachService();
const crmGraph = new CrmGraphMemoryService();

export type GenerateDocumentResult = {
  documentId: string;
  referenceNumber: string;
  checksum: string;
  buffer: Buffer;
  metadata: DocumentMetadataSnapshot;
};

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

async function nextReferenceInTransaction(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tenantId: string,
  documentType: FinancialDocumentType
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = documentType === 'quotation' ? 'QUO' : documentType === 'invoice' ? 'INV' : documentType === 'receipt' ? 'REC' : 'PN';
  const pattern = `${prefix}-${year}-%`;

  const rows = await tx
    .select({ referenceNumber: generatedDocuments.referenceNumber })
    .from(generatedDocuments)
    .where(
      and(
        eq(generatedDocuments.tenantId, tenantId),
        eq(generatedDocuments.documentType, documentType),
        sql`${generatedDocuments.referenceNumber} LIKE ${pattern}`
      )
    )
    .orderBy(desc(generatedDocuments.referenceNumber))
    .limit(1);

  const lastSeq = rows[0] ? parseReferenceSequence(rows[0].referenceNumber) : null;
  return formatReferenceNumber(documentType, year, (lastSeq ?? 0) + 1);
}

export class DocumentGenerationService {
  async hasAutoDocumentForTransaction(
    tenantId: string,
    bookingId: string,
    documentType: FinancialDocumentType,
    transactionId: string
  ): Promise<boolean> {
    const found = await db
      .select({ id: generatedDocuments.id })
      .from(generatedDocuments)
      .where(
        and(
          eq(generatedDocuments.tenantId, tenantId),
          eq(generatedDocuments.bookingId, bookingId),
          eq(generatedDocuments.documentType, documentType),
          sql`(${generatedDocuments.metadata}->>'transactionId') = ${transactionId}`
        )
      )
      .limit(1);
    return found.length > 0;
  }

  async buildSnapshot(input: {
    tenantId: string;
    bookingId: string;
    documentType: FinancialDocumentType;
    referenceNumber: string;
    transactionId?: string;
  }): Promise<DocumentMetadataSnapshot> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, input.bookingId), eq(bookings.tenantId, input.tenantId)))
      .limit(1);

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }
    if (!booking.guestId) {
      throw new AppError(400, 'Booking has no guest');
    }

    const [guest] = await db
      .select()
      .from(guests)
      .where(and(eq(guests.id, booking.guestId), eq(guests.tenantId, input.tenantId)))
      .limit(1);

    if (!guest) {
      throw new AppError(404, 'Guest not found');
    }

    let propertyRow: typeof properties.$inferSelect | null = null;
    if (booking.propertyId) {
      const [p] = await db
        .select()
        .from(properties)
        .where(and(eq(properties.id, booking.propertyId), eq(properties.tenantId, input.tenantId)))
        .limit(1);
      propertyRow = p ?? null;
    }

    const profile = getHotelEtunaPropertyTaxProfile();
    const namra = getHotelEtunaNamraRegistration();
    const folio = await getFolioService().getFolio(input.bookingId);

    if (input.documentType === 'invoice' && !folio.folioClosedAt) {
      throw new AppError(400, 'Invoice requires a closed folio');
    }

    let transactionSnapshot: DocumentMetadataSnapshot['transaction'] | undefined;
    if (input.transactionId) {
      const [txn] = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, input.transactionId),
            eq(transactions.tenantId, input.tenantId),
            eq(transactions.bookingId, input.bookingId)
          )
        )
        .limit(1);

      if (!txn) {
        throw new AppError(404, 'Transaction not found for this booking');
      }
      if (txn.status !== 'completed') {
        throw new AppError(400, 'Transaction is not completed');
      }

      const method =
        (txn.metadata as Record<string, unknown> | null)?.methodType?.toString() ??
        txn.paymentGateway ??
        'payment';

      transactionSnapshot = {
        id: txn.id,
        reference: txn.transactionReference,
        amount: toNumber(txn.amount),
        method: String(method),
        processedAt: (txn.processedAt ?? new Date()).toISOString(),
        paymentGateway: txn.paymentGateway,
      };

      if (input.documentType === 'payment_notification' && !isPaymentNotificationMethod(String(method))) {
        throw new AppError(400, 'Payment notification requires EFT, bank deposit, or e-wallet method');
      }
    } else if (input.documentType === 'receipt' || input.documentType === 'payment_notification') {
      throw new AppError(400, 'transactionId is required for this document type');
    }

    const lineItems = folio.lines
      .filter((l) => l.chargeType !== 'payment' && l.chargeType !== 'tax')
      .map((l) => ({
        description: l.description,
        chargeType: l.chargeType,
        amount: l.amount,
      }));

    if (lineItems.length === 0 && booking.totalAmount) {
      lineItems.push({
        description: `Stay ${booking.bookingReference ?? booking.id.slice(0, 8)}`,
        chargeType: 'room',
        amount: toNumber(booking.totalAmount),
      });
    }

    const tax = sumDocumentLineTaxes(
      lineItems.map((l) => ({ chargeType: l.chargeType, amount: l.amount })),
      profile
    );

    const depositPercent = toNumber(booking.depositPercent) || 30;
    const total = tax.totalInclusive;
    const depositDue = Math.round(total * (depositPercent / 100) * 100) / 100;
    const balanceDue = Math.max(0, Math.round((total - depositDue) * 100) / 100);

    const guestName = [guest.firstName, guest.lastName].filter(Boolean).join(' ').trim() || 'Guest';

    return {
      version: 1,
      documentType: input.documentType,
      referenceNumber: input.referenceNumber,
      bookingId: booking.id,
      bookingReference: booking.bookingReference ?? booking.id.slice(0, 8).toUpperCase(),
      checkInDate: String(booking.checkInDate),
      checkOutDate: String(booking.checkOutDate),
      guest: {
        id: guest.id,
        name: guestName,
        email: guest.email ?? '',
        phone: guest.phone,
      },
      property: {
        id: propertyRow?.id ?? booking.propertyId ?? '',
        name: propertyRow?.name ?? namra.tradeName,
        address: propertyRow?.address,
        legalName: profile.legalName,
        vatRef: profile.vatRegistrationNumber,
        ccNumber: profile.registrationNumber,
        postalAddress: namra.postalAddress,
      },
      lineItems,
      tax,
      totals: {
        subtotal: tax.taxableBase,
        vat: tax.vat15,
        ntbLevy: tax.ntbLevy2,
        total,
        currency: booking.currency ?? folio.currency ?? 'NAD',
        depositPercent,
        depositDue,
        balanceDue,
      },
      transaction: transactionSnapshot,
      transactionId: input.transactionId ?? null,
      issuedAt: new Date().toISOString(),
      pricesVatInclusive: profile.pricesVatInclusive,
    };
  }

  async generateDocumentBuffer(input: {
    tenantId: string;
    bookingId: string;
    documentType: FinancialDocumentType;
    generatedBy: string;
    transactionId?: string;
    skipIdempotency?: boolean;
  }): Promise<GenerateDocumentResult> {
    try {
      if (
        input.transactionId &&
        !input.skipIdempotency &&
        (await this.hasAutoDocumentForTransaction(
          input.tenantId,
          input.bookingId,
          input.documentType,
          input.transactionId
        ))
      ) {
        const [existing] = await db
          .select()
          .from(generatedDocuments)
          .where(
            and(
              eq(generatedDocuments.tenantId, input.tenantId),
              eq(generatedDocuments.bookingId, input.bookingId),
              eq(generatedDocuments.documentType, input.documentType),
              sql`(${generatedDocuments.metadata}->>'transactionId') = ${input.transactionId}`
            )
          )
          .orderBy(desc(generatedDocuments.generatedAt))
          .limit(1);

        if (existing) {
          const metadata = existing.metadata as DocumentMetadataSnapshot;
          const buffer = await renderDocumentPdfBuffer(metadata);
          return {
            documentId: existing.id,
            referenceNumber: existing.referenceNumber,
            checksum: existing.checksum,
            buffer,
            metadata,
          };
        }
      }

      let documentId = '';
      let referenceNumber = '';
      let metadata!: DocumentMetadataSnapshot;
      let buffer!: Buffer;
      let checksum = '';

      await db.transaction(async (tx) => {
        referenceNumber = await nextReferenceInTransaction(tx, input.tenantId, input.documentType);
        metadata = await this.buildSnapshot({
          tenantId: input.tenantId,
          bookingId: input.bookingId,
          documentType: input.documentType,
          referenceNumber,
          transactionId: input.transactionId,
        });

        const metaWithTxn = {
          ...metadata,
          transactionId: input.transactionId ?? null,
        };

        buffer = await renderDocumentPdfBuffer(metadata);
        checksum = sha256(buffer);

        const [row] = await tx
          .insert(generatedDocuments)
          .values({
            tenantId: input.tenantId,
            bookingId: input.bookingId,
            documentType: input.documentType,
            referenceNumber,
            generatedBy: input.generatedBy,
            metadata: metaWithTxn,
            checksum,
          })
          .returning({ id: generatedDocuments.id });

        documentId = row?.id ?? '';
      });

      return { documentId, referenceNumber, checksum, buffer, metadata };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Error generating document');
    }
  }

  async regenerateFromRecord(documentId: string, tenantId: string): Promise<Buffer> {
    const [row] = await db
      .select()
      .from(generatedDocuments)
      .where(and(eq(generatedDocuments.id, documentId), eq(generatedDocuments.tenantId, tenantId)))
      .limit(1);

    if (!row) {
      throw new AppError(404, 'Document not found');
    }

    const metadata = row.metadata as DocumentMetadataSnapshot;
    const buffer = await renderDocumentPdfBuffer(metadata);
    const newChecksum = sha256(buffer);

    if (newChecksum !== row.checksum) {
      securityLogger.warn('[DocumentGenerationService] checksum drift on re-render', {
        documentId,
        referenceNumber: row.referenceNumber,
      });
    }

    return buffer;
  }

  async listForBooking(tenantId: string, bookingId: string) {
    return db
      .select({
        id: generatedDocuments.id,
        documentType: generatedDocuments.documentType,
        referenceNumber: generatedDocuments.referenceNumber,
        generatedAt: generatedDocuments.generatedAt,
        checksum: generatedDocuments.checksum,
        transactionId: sql<string | null>`${generatedDocuments.metadata}->>'transactionId'`,
      })
      .from(generatedDocuments)
      .where(
        and(eq(generatedDocuments.tenantId, tenantId), eq(generatedDocuments.bookingId, bookingId))
      )
      .orderBy(desc(generatedDocuments.generatedAt));
  }

  async listForPeriod(
    tenantId: string,
    from: Date,
    to: Date,
    filters?: { bookingId?: string; documentType?: FinancialDocumentType }
  ) {
    const conditions = [
      eq(generatedDocuments.tenantId, tenantId),
      gte(generatedDocuments.generatedAt, from),
      lte(generatedDocuments.generatedAt, to),
    ];

    if (filters?.bookingId) {
      conditions.push(eq(generatedDocuments.bookingId, filters.bookingId));
    }
    if (filters?.documentType) {
      conditions.push(eq(generatedDocuments.documentType, filters.documentType));
    }

    return db
      .select({
        id: generatedDocuments.id,
        bookingId: generatedDocuments.bookingId,
        documentType: generatedDocuments.documentType,
        referenceNumber: generatedDocuments.referenceNumber,
        generatedAt: generatedDocuments.generatedAt,
      })
      .from(generatedDocuments)
      .where(and(...conditions))
      .orderBy(desc(generatedDocuments.generatedAt));
  }

  async emailGeneratedDocument(input: {
    tenantId: string;
    result: GenerateDocumentResult;
  }): Promise<void> {
    const { result } = input;
    const { metadata, buffer } = result;
    const documentType = metadata.documentType;

    if (!metadata.guest.email?.trim()) {
      securityLogger.warn('[DocumentGenerationService] no guest email — PDF logged only', {
        bookingId: metadata.bookingId,
        documentType,
      });
      return;
    }

    const subject = documentEmailSubject(
      documentType,
      result.referenceNumber,
      metadata.property.name
    );
    const filename = `${result.referenceNumber}.pdf`;

    await emailService.sendEmail(input.tenantId, {
      to: metadata.guest.email,
      subject,
      htmlContent: `<p>Dear ${metadata.guest.name},</p><p>Please find your ${documentType.replace('_', ' ')} attached (${result.referenceNumber}).</p>`,
      textContent: `Dear ${metadata.guest.name},\n\nYour ${documentType} ${result.referenceNumber} is attached.`,
      propertyId: metadata.property.id || undefined,
      metadata: {
        emailKind: `${documentType}_pdf`,
        bookingId: metadata.bookingId,
        documentId: result.documentId,
        referenceNumber: result.referenceNumber,
        transactionId: metadata.transactionId ?? null,
      },
      attachments: [
        {
          filename,
          content: buffer,
          contentType: 'application/pdf',
        },
      ],
    });

    await outreach.logTouch({
      tenantId: input.tenantId,
      guestId: metadata.guest.id,
      propertyId: metadata.property.id || null,
      channel: 'email',
      campaignKey: documentCampaignKey(documentType),
      messageSubject: subject,
      messageBody: `PDF ${result.referenceNumber} emailed`,
      status: 'sent',
      sentAt: new Date(),
      workflowStage: 'booking_lifecycle',
    });

    await crmGraph.ensureEdge({
      tenantId: input.tenantId,
      srcType: 'guest',
      srcId: metadata.guest.id,
      dstType: 'document',
      dstId: result.documentId,
      relationType: 'received_document',
      metadata: { referenceNumber: result.referenceNumber, documentType },
    });
  }

  async generateAndEmail(input: {
    tenantId: string;
    bookingId: string;
    documentType: FinancialDocumentType;
    generatedBy: string;
    transactionId?: string;
    skipIdempotency?: boolean;
  }): Promise<GenerateDocumentResult | null> {
    const result = await this.generateDocumentBuffer(input);
    await this.emailGeneratedDocument({ tenantId: input.tenantId, result });
    return result;
  }

  async recordManualGenerateAudit(input: {
    tenantId: string;
    userId: string;
    documentId: string;
    documentType: FinancialDocumentType;
    referenceNumber: string;
    bookingId: string;
  }): Promise<void> {
    await recordAuditTrail({
      tenantId: input.tenantId,
      userId: input.userId,
      action: 'document.generated',
      resourceType: 'generated_document',
      resourceId: input.documentId,
      newValues: {
        documentType: input.documentType,
        referenceNumber: input.referenceNumber,
        bookingId: input.bookingId,
      },
    });
  }
}

export const documentGenerationService = new DocumentGenerationService();

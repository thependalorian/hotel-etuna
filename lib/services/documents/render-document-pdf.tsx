/**
 * Server-side PDF render bridge for guest financial documents.
 * Location: lib/services/documents/render-document-pdf.tsx
 */

import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import type { DocumentMetadataSnapshot } from '@/lib/services/documents/document-types';
import { registerPdfFonts } from '@/lib/services/documents/pdf-fonts';
import { QuotationPDF } from '@/components/features/documents/QuotationPDF';
import { InvoicePDF } from '@/components/features/documents/InvoicePDF';
import { ReceiptPDF } from '@/components/features/documents/ReceiptPDF';
import { PaymentNotificationPDF } from '@/components/features/documents/PaymentNotificationPDF';

export async function renderDocumentPdfBuffer(
  snapshot: DocumentMetadataSnapshot
): Promise<Buffer> {
  registerPdfFonts();

  let element: React.ReactElement;
  switch (snapshot.documentType) {
    case 'quotation':
      element = <QuotationPDF data={snapshot} />;
      break;
    case 'invoice':
      element = <InvoicePDF data={snapshot} />;
      break;
    case 'receipt':
      element = <ReceiptPDF data={snapshot} />;
      break;
    case 'payment_notification':
      element = <PaymentNotificationPDF data={snapshot} />;
      break;
    default:
      throw new Error(`Unsupported document type: ${snapshot.documentType}`);
  }

  const buffer = await renderToBuffer(
    element as React.ReactElement<DocumentProps>
  );
  return Buffer.from(buffer);
}

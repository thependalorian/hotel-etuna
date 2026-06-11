/**
 * Guest financial PDF document types, validation, and reference prefixes.
 * Location: lib/services/documents/document-types.ts
 */

import { z } from 'zod';

export const DOCUMENT_TYPES = [
  'quotation',
  'invoice',
  'receipt',
  'payment_notification',
] as const;

export type FinancialDocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_REFERENCE_PREFIX: Record<FinancialDocumentType, string> = {
  quotation: 'QUO',
  invoice: 'INV',
  receipt: 'REC',
  payment_notification: 'PN',
};

export const DOCUMENT_STAFF_ROLES = [
  'owner',
  'manager',
  'admin',
  'staff',
  'desk',
  'front_desk',
] as const;

export const generateDocumentBodySchema = z.object({
  bookingId: z.string().uuid(),
  documentType: z.enum(DOCUMENT_TYPES),
  transactionId: z.string().uuid().optional(),
  emailToGuest: z.boolean().optional(),
});

export const guestFinancialDocumentBodySchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  transactionId: z.string().uuid().optional(),
});

export type DocumentLineItemSnapshot = {
  description: string;
  chargeType: string;
  amount: number;
};

export type DocumentTransactionSnapshot = {
  id: string;
  reference: string;
  amount: number;
  method: string;
  processedAt: string;
  paymentGateway?: string | null;
};

export type DocumentMetadataSnapshot = {
  version: 1;
  documentType: FinancialDocumentType;
  referenceNumber: string;
  bookingId: string;
  bookingReference: string;
  checkInDate: string;
  checkOutDate: string;
  guest: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  property: {
    id: string;
    name: string;
    address?: string | null;
    legalName: string;
    vatRef?: string | null;
    ccNumber?: string | null;
    postalAddress: string;
  };
  lineItems: DocumentLineItemSnapshot[];
  tax: {
    taxableBase: number;
    vat15: number;
    ntbLevy2: number;
    totalInclusive: number;
  };
  totals: {
    subtotal: number;
    vat: number;
    ntbLevy: number;
    total: number;
    currency: string;
    depositPercent?: number;
    depositDue?: number;
    balanceDue?: number;
  };
  transaction?: DocumentTransactionSnapshot;
  issuedAt: string;
  pricesVatInclusive: boolean;
  transactionId?: string | null;
};

export const PAYMENT_NOTIFICATION_METHODS = new Set([
  'eft',
  'bank_deposit',
  'ewallet',
  'bank_eft',
  'Bank EFT',
]);

export function isPaymentNotificationMethod(method: string): boolean {
  const normalized = method.toLowerCase().replace(/\s+/g, '_');
  return (
    normalized.includes('eft') ||
    normalized.includes('bank_deposit') ||
    normalized.includes('ewallet') ||
    normalized === 'bank_eft'
  );
}

export function documentCampaignKey(documentType: FinancialDocumentType): string {
  const map: Record<FinancialDocumentType, string> = {
    quotation: 'quotation_pdf_email',
    invoice: 'invoice_pdf_email',
    receipt: 'receipt_pdf_email',
    payment_notification: 'payment_notification_pdf_email',
  };
  return map[documentType];
}

export function documentEmailSubject(
  documentType: FinancialDocumentType,
  referenceNumber: string,
  propertyName: string
): string {
  const labels: Record<FinancialDocumentType, string> = {
    quotation: 'Quotation',
    invoice: 'Tax invoice',
    receipt: 'Payment receipt',
    payment_notification: 'Payment notification',
  };
  return `${labels[documentType]} ${referenceNumber} — ${propertyName}`;
}

/**
 * Sequential reference numbers per document type and calendar year (race-safe in transaction).
 * Location: lib/services/documents/document-reference-generator.ts
 */

import { db, generatedDocuments } from '@/lib/db';
import { and, desc, eq, like } from 'drizzle-orm';
import {
  DOCUMENT_REFERENCE_PREFIX,
  type FinancialDocumentType,
} from '@/lib/services/documents/document-types';

export function formatReferenceNumber(
  documentType: FinancialDocumentType,
  year: number,
  sequence: number
): string {
  const prefix = DOCUMENT_REFERENCE_PREFIX[documentType];
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}

export function parseReferenceSequence(referenceNumber: string): number | null {
  const match = referenceNumber.match(/-(\d{4})$/);
  if (!match) return null;
  const seq = Number.parseInt(match[1], 10);
  return Number.isFinite(seq) ? seq : null;
}

/**
 * Allocate the next reference inside an open Drizzle transaction.
 */
export async function allocateDocumentReference(
  tenantId: string,
  documentType: FinancialDocumentType,
  year: number = new Date().getFullYear()
): Promise<string> {
  const prefix = DOCUMENT_REFERENCE_PREFIX[documentType];
  const pattern = `${prefix}-${year}-%`;

  const [latest] = await db
    .select({ referenceNumber: generatedDocuments.referenceNumber })
    .from(generatedDocuments)
    .where(
      and(
        eq(generatedDocuments.tenantId, tenantId),
        eq(generatedDocuments.documentType, documentType),
        like(generatedDocuments.referenceNumber, pattern)
      )
    )
    .orderBy(desc(generatedDocuments.referenceNumber))
    .limit(1);

  const lastSeq = latest ? parseReferenceSequence(latest.referenceNumber) : null;
  const nextSeq = (lastSeq ?? 0) + 1;
  return formatReferenceNumber(documentType, year, nextSeq);
}

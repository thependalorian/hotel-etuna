/**
 * GET /api/documents — list generated financial documents (staff).
 * Location: app/api/documents/route.ts
 *
 * Query: from, to, bookingId, documentType
 * Response: { success: true, data: DocumentListItem[] }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, successResponse } from '@/lib/utils/api-helpers';
import {
  DOCUMENT_STAFF_ROLES,
  DOCUMENT_TYPES,
  type FinancialDocumentType,
} from '@/lib/services/documents/document-types';
import { documentGenerationService } from '@/lib/services/documents/DocumentGenerationService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { searchParams } = req.nextUrl;
      const fromRaw = searchParams.get('from');
      const toRaw = searchParams.get('to');
      const bookingId = searchParams.get('bookingId') ?? undefined;
      const documentTypeRaw = searchParams.get('documentType');

      const from = fromRaw ? new Date(fromRaw) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = toRaw ? new Date(toRaw) : new Date();

      let documentType: FinancialDocumentType | undefined;
      if (documentTypeRaw && DOCUMENT_TYPES.includes(documentTypeRaw as FinancialDocumentType)) {
        documentType = documentTypeRaw as FinancialDocumentType;
      }

      if (bookingId) {
        const rows = await documentGenerationService.listForBooking(user.tenantId!, bookingId);
        return successResponse(rows);
      }

      const rows = await documentGenerationService.listForPeriod(user.tenantId!, from, to, {
        documentType,
      });
      return successResponse(rows);
    },
    { rateLimit: true, requireRole: [...DOCUMENT_STAFF_ROLES, 'admin'] }
  );
}

/**
 * @fileoverview API route //api/documents/generate
 * Location: /app/api/documents/generate/route.ts
 */

/**
 * POST /api/documents/generate — staff generate guest financial PDF.
 * Location: app/api/documents/generate/route.ts
 *
 * Body: { bookingId, documentType, transactionId?, emailToGuest? }
 * Response: application/pdf stream + X-Document-Id header
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  validateJsonBody,
} from '@/lib/utils/api-helpers';
import {
  DOCUMENT_STAFF_ROLES,
  generateDocumentBodySchema,
} from '@/lib/services/documents/document-types';
import { documentGenerationService } from '@/lib/services/documents/DocumentGenerationService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      const body = await validateJsonBody(req, generateDocumentBodySchema);

      const result = await documentGenerationService.generateDocumentBuffer({
        tenantId: user.tenantId!,
        bookingId: body.bookingId,
        documentType: body.documentType,
        generatedBy: user.id,
        transactionId: body.transactionId,
        skipIdempotency: true,
      });

      await documentGenerationService.recordManualGenerateAudit({
        tenantId: user.tenantId!,
        userId: user.id,
        documentId: result.documentId,
        documentType: body.documentType,
        referenceNumber: result.referenceNumber,
        bookingId: body.bookingId,
      });

      if (body.emailToGuest) {
        await documentGenerationService.emailGeneratedDocument({
          tenantId: user.tenantId!,
          result,
        });
      }

      return new NextResponse(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${result.referenceNumber}.pdf"`,
          'X-Document-Id': result.documentId,
          'X-Document-Reference': result.referenceNumber,
          'X-Checksum': result.checksum,
        },
      });
    },
    { rateLimit: true, requireRole: [...DOCUMENT_STAFF_ROLES, 'admin'] }
  );
}

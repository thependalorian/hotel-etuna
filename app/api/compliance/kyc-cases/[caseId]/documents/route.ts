/**
 * Register uploaded evidence for a KYC/KYB case
 *
 * Purpose: Link document type + URL after client uploads to storage
 * Location: /app/api/compliance/kyc-cases/[caseId]/documents/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { ComplianceVerificationService } from '@/lib/services/compliance/ComplianceVerificationService';
import { addComplianceDocumentSchema } from '@/lib/utils/validation';

const service = new ComplianceVerificationService();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await context.params;
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      const kase = await service.getCase(user.tenantId, caseId);
      if (!kase) {
        return errorResponse('Case not found', 404, 'NOT_FOUND');
      }
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }
      const parsed = addComplianceDocumentSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }
      const doc = await service.addDocument(user.tenantId, {
        caseId,
        documentType: parsed.data.documentType,
        fileUrl: parsed.data.fileUrl,
        fileName: parsed.data.fileName,
        uploadedByUserId: user.id,
        metadata: parsed.data.metadata,
      });
      return successResponse({ document: doc }, 201);
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

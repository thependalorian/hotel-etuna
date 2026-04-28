/**
 * Single KYC/KYB case — detail + documents
 *
 * Purpose: Fetch one case and attached evidence for reviewer UI
 * Location: /app/api/compliance/kyc-cases/[caseId]/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { ComplianceVerificationService } from '@/lib/services/compliance/ComplianceVerificationService';

const service = new ComplianceVerificationService();

export async function GET(
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
      const row = await service.getCase(user.tenantId, caseId);
      if (!row) {
        return errorResponse('Case not found', 404, 'NOT_FOUND');
      }
      const documents = await service.listDocuments(user.tenantId, caseId);
      return successResponse({ case: row, documents });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

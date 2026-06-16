/**
 * @fileoverview API route //api/compliance/kyc-cases
 * Location: /app/api/compliance/kyc-cases/route.ts
 */

/**
 * KYC/KYB compliance cases API
 *
 * Purpose: List and create verification cases (LangGraph workflow + manual review)
 * Location: /app/api/compliance/kyc-cases/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { ComplianceVerificationService } from '@/lib/services/compliance/ComplianceVerificationService';
import { createComplianceCaseSchema } from '@/lib/utils/validation';

const service = new ComplianceVerificationService();

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      const status = req.nextUrl.searchParams.get('status') ?? undefined;
      const cases = await service.listCases(user.tenantId, status || undefined);
      return successResponse({ cases });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }
      const parsed = createComplianceCaseSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }
      const {
        subjectType,
        subjectId,
        subjectParty,
        kycTier,
        profile,
        runWorkflow,
        allowAutoApproveLite,
      } = parsed.data;

      const created = await service.createCase(user.tenantId, {
        subjectType,
        subjectId: subjectId ?? null,
        subjectParty,
        kycTier,
        profile,
        status: 'draft',
      });

      if (runWorkflow) {
        await service.runValidationWorkflow(user.tenantId, created.id, {
          allowAutoApproveLite: allowAutoApproveLite === true,
        });
        const refreshed = await service.getCase(user.tenantId, created.id);
        return successResponse({ case: refreshed }, 201);
      }

      return successResponse({ case: created }, 201);
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

/**
 * Manual reviewer decision (human-in-the-loop) via LangGraph decision graph
 *
 * Purpose: Approve / reject / request more info; updates staff when subject is staff
 * Location: /app/api/compliance/kyc-cases/[caseId]/decision/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { ComplianceVerificationService } from '@/lib/services/compliance/ComplianceVerificationService';
import { complianceDecisionSchema } from '@/lib/utils/validation';
import { recordAuditTrail } from '@/lib/compliance/record-audit';

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
      const parsed = complianceDecisionSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }
      const { result, status } = await service.applyReviewerDecision(
        user.tenantId,
        caseId,
        user.id,
        parsed.data.decision,
        parsed.data.notes
      );
      const row = await service.getCase(user.tenantId, caseId);
      await recordAuditTrail({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'compliance.kyc_case.decision_applied',
        resourceType: 'compliance_verification_case',
        resourceId: caseId,
        newValues: {
          decision: parsed.data.decision,
          status,
          workflowStage: row?.workflowStage ?? null,
        },
        request,
      });
      return successResponse({
        case: row,
        decisionResult: result,
        status,
      });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

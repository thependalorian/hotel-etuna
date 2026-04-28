/**
 * Run LangGraph validation workflow for a case
 *
 * Purpose: Re-evaluate profile + documents; set needs_info or pending_manual_review
 * Location: /app/api/compliance/kyc-cases/[caseId]/run/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { ComplianceVerificationService } from '@/lib/services/compliance/ComplianceVerificationService';
import { runComplianceWorkflowSchema } from '@/lib/utils/validation';
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
      let body: unknown = {};
      try {
        const text = await request.text();
        if (text) body = JSON.parse(text);
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }
      const parsed = runComplianceWorkflowSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }
      const { result, status } = await service.runValidationWorkflow(
        user.tenantId,
        caseId,
        { allowAutoApproveLite: parsed.data.allowAutoApproveLite === true }
      );
      const row = await service.getCase(user.tenantId, caseId);
      await recordAuditTrail({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'compliance.kyc_case.workflow_run',
        resourceType: 'compliance_verification_case',
        resourceId: caseId,
        newValues: {
          status,
          allowAutoApproveLite: parsed.data.allowAutoApproveLite === true,
          workflowStage: row?.workflowStage ?? null,
        },
        request,
      });
      return successResponse({
        case: row,
        workflowResult: result,
        status,
      });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

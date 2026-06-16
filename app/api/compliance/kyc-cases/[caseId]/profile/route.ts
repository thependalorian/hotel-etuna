/**
 * @fileoverview API route //api/compliance/kyc-cases/[caseId]/profile
 * Location: /app/api/compliance/kyc-cases/[caseId]/profile/route.ts
 */

/**
 * Update case profile (e.g. after needs_info)
 *
 * Purpose: Merge JSON profile fields before re-running validation workflow
 * Location: /app/api/compliance/kyc-cases/[caseId]/profile/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { db, complianceVerificationCases } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const patchSchema = z.object({
  profile: z.record(z.string(), z.unknown()),
});

export async function PATCH(
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
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }
      const parsed = patchSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }
      const [existing] = await db
        .select()
        .from(complianceVerificationCases)
        .where(
          and(
            eq(complianceVerificationCases.id, caseId),
            eq(complianceVerificationCases.tenantId, user.tenantId)
          )
        )
        .limit(1);
      if (!existing) {
        return errorResponse('Case not found', 404, 'NOT_FOUND');
      }
      const merged = {
        ...(existing.profile as Record<string, unknown>),
        ...parsed.data.profile,
      };
      const [updated] = await db
        .update(complianceVerificationCases)
        .set({
          profile: merged,
          status: 'draft',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(complianceVerificationCases.id, caseId),
            eq(complianceVerificationCases.tenantId, user.tenantId)
          )
        )
        .returning();
      return successResponse({ case: updated });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

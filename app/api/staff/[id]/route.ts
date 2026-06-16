/**
 * @fileoverview API route //api/staff/[id]
 * Location: /app/api/staff/[id]/route.ts
 */

/**
 * Single staff member API
 * Location: app/api/staff/[id]/route.ts
 *
 * GET, PATCH, DELETE — tenant-scoped
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { StaffService } from '@/lib/services/staff/StaffService';
import { createStaffSchema } from '@/lib/utils/validation';
import { entityId } from '@/lib/validation/entity-ids';
import { AppError } from '@/lib/utils/errors';
import type { NewStaff } from '@/lib/db/schema';
import { securityLogger } from '@/lib/utils/security-logger';

const staffService = new StaffService();

const updateStaffSchema = createStaffSchema.partial();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      const { id } = await params;
      const idCheck = entityId('Invalid staff ID').safeParse(id);
      if (!idCheck.success) {
        return errorResponse('Invalid staff ID', 400, 'VALIDATION_ERROR');
      }

      const member = await staffService.getStaffById(id, user.tenantId);
      if (!member) {
        return errorResponse('Staff member not found', 404, 'NOT_FOUND');
      }
      return successResponse(member);
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      const { id } = await params;
      const idCheck = entityId('Invalid staff ID').safeParse(id);
      if (!idCheck.success) {
        return errorResponse('Invalid staff ID', 400, 'VALIDATION_ERROR');
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = updateStaffSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      try {
        const {
          openComplianceCase: _o,
          complianceSubjectParty: _p,
          complianceKycTier: _k,
          hireDate,
          terminationDate,
          ...staffFields
        } = validation.data;
        
        const toDateStr = (d: Date | string | undefined): string | undefined => {
          if (d === undefined) return undefined;
          return d instanceof Date ? d.toISOString().slice(0, 10) : d;
        };
        
        const { salary, ...restStaffFields } = staffFields;
        const patch: Partial<NewStaff> = {
          ...restStaffFields,
          ...(salary !== undefined ? { salary: String(salary) } : {}),
          ...(hireDate !== undefined ? { hireDate: toDateStr(hireDate)! } : {}),
          ...(terminationDate !== undefined
            ? { terminationDate: toDateStr(terminationDate)! }
            : {}),
        };
        const updated = await staffService.updateStaff(
          id,
          user.tenantId,
          patch
        );
        return successResponse(updated);
      } catch (error: unknown) {
        if (error instanceof AppError && error.statusCode === 404) {
          return errorResponse('Staff member not found', 404, 'NOT_FOUND');
        }
        securityLogger.error('[PATCH /api/staff/[id]]', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      const { id } = await params;
      const idCheck = entityId('Invalid staff ID').safeParse(id);
      if (!idCheck.success) {
        return errorResponse('Invalid staff ID', 400, 'VALIDATION_ERROR');
      }

      try {
        await staffService.deleteStaff(id, user.tenantId);
        return successResponse({ deleted: true });
      } catch (error: unknown) {
        if (error instanceof AppError && error.statusCode === 404) {
          return errorResponse('Staff member not found', 404, 'NOT_FOUND');
        }
        securityLogger.error('[DELETE /api/staff/[id]]', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

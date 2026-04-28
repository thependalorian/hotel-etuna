/**
 * Staff API Route
 * 
 * Purpose: Manage staff operations with system design principles
 * Location: /app/api/staff/route.ts
 * 
 * Implements:
 * - Authentication & authorization
 * - Rate limiting
 * - Tenant isolation
 * - Input validation
 * - Error handling
 * 
 * Following System Design Principles:
 * - API Design Best Practices
 * - Security Architecture
 * - Multi-Tenancy Strategy
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { StaffService } from '@/lib/services/staff/StaffService';
import { ComplianceVerificationService } from '@/lib/services/compliance/ComplianceVerificationService';
import { createStaffSchema } from '@/lib/utils/validation';

const staffService = new StaffService();
const complianceService = new ComplianceVerificationService();

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      const staff = await staffService.getStaffByTenant(user.tenantId);
      return successResponse(staff);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      let body;
      try {
        body = await request.json();
      } catch (error) {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = createStaffSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const {
        openComplianceCase,
        complianceSubjectParty,
        complianceKycTier,
        ...staffFields
      } = validation.data;

      const hireDateStr =
        staffFields.hireDate instanceof Date
          ? staffFields.hireDate.toISOString().slice(0, 10)
          : String(staffFields.hireDate);

      const newStaff = await staffService.createStaff(user.tenantId, {
        ...staffFields,
        hireDate: hireDateStr,
        status: openComplianceCase
          ? 'pending_verification'
          : staffFields.status ?? 'active',
      } as Parameters<typeof staffService.createStaff>[1]);

      let complianceCaseId: string | undefined;
      if (openComplianceCase) {
        const tier = complianceKycTier ?? 'lite';
        const party = complianceSubjectParty ?? 'individual';
        const profile: Record<string, string> = {
          fullName: `${staffFields.firstName} ${staffFields.lastName}`.trim(),
          nationality: '',
          nationalIdOrPassport: '',
        };
        if (staffFields.email) profile.email = staffFields.email;
        if (staffFields.phone) profile.phone = staffFields.phone;

        const kase = await complianceService.createCase(user.tenantId, {
          subjectType: 'staff',
          subjectId: newStaff.id,
          subjectParty: party,
          kycTier: tier,
          profile,
          status: 'draft',
        });
        complianceCaseId = kase.id;
      }

      /** Flat staff object preserves prior API shape; complianceCaseId only when opened */
      const payload = complianceCaseId
        ? { ...newStaff, complianceCaseId }
        : newStaff;
      return successResponse(payload, 201);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

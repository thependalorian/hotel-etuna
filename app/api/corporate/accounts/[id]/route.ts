/**
 * Corporate Account Detail API Route
 * 
 * Purpose: Get, update, or delete a specific corporate account
 * Location: /app/api/corporate/accounts/[id]/route.ts
 * 
 * Agent A7 - Corporate Billing Feature
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { CorporateAccountService } from '@/lib/services/crm/CorporateAccountService';
import { corporateAccountSchema } from '@/lib/utils/validation';

const corporateAccountService = new CorporateAccountService();

/**
 * GET /api/corporate/accounts/[id]
 * Get a specific corporate account
 */
export async function GET(
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
      const account = await corporateAccountService.getAccountById(id, user.tenantId);
      return successResponse(account);
    },
    {
      requireRole: ['owner', 'manager', 'staff'],
      rateLimit: true,
    }
  );
}

/**
 * PUT /api/corporate/accounts/[id]
 * Update a corporate account
 */
export async function PUT(
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

      let body;
      try {
        body = await request.json();
      } catch (error) {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = corporateAccountSchema.partial().safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const updatedAccount = await corporateAccountService.updateAccount(
        id,
        user.tenantId,
        validation.data
      );
      
      return successResponse(updatedAccount);
    },
    {
      requireRole: ['owner', 'manager', 'staff'],
      rateLimit: true,
    }
  );
}

/**
 * DELETE /api/corporate/accounts/[id]
 * Soft delete a corporate account (set status to inactive)
 */
export async function DELETE(
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
      await corporateAccountService.deleteAccount(id, user.tenantId);
      
      return successResponse({ message: 'Corporate account deleted successfully' });
    },
    {
      requireRole: ['owner', 'manager'],
      rateLimit: true,
    }
  );
}

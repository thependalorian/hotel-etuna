/**
 * Corporate Accounts API Route
 * 
 * Purpose: Manage corporate B2B accounts with system design principles
 * Location: /app/api/corporate/accounts/route.ts
 * 
 * Implements:
 * - Authentication & authorization (staff only)
 * - Rate limiting
 * - Tenant isolation
 * - Input validation (Zod)
 * - Error handling
 * 
 * Agent A7 - Corporate Billing Feature
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { CorporateAccountService } from '@/lib/services/crm/CorporateAccountService';
import { corporateAccountSchema } from '@/lib/utils/validation';

const corporateAccountService = new CorporateAccountService();

/**
 * GET /api/corporate/accounts
 * List all corporate accounts for the tenant
 */
export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const accounts = await corporateAccountService.getAccountsByTenant(user.tenantId);
      return successResponse(accounts);
    },
    {
      requireRole: ['owner', 'manager', 'staff'],
      rateLimit: true,
    }
  );
}

/**
 * POST /api/corporate/accounts
 * Create a new corporate account
 */
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

      const validation = corporateAccountSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const newAccount = await corporateAccountService.createAccount(
        user.tenantId,
        validation.data
      );
      
      return successResponse(newAccount, 201);
    },
    {
      requireRole: ['owner', 'manager', 'staff'],
      rateLimit: true,
    }
  );
}

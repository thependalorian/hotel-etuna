/**
 * Corporate Account Contacts API Route
 * 
 * Purpose: Manage contacts for a corporate account
 * Location: /app/api/corporate/accounts/[id]/contacts/route.ts
 * 
 * Agent A7 - Corporate Billing Feature
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { CorporateAccountService } from '@/lib/services/crm/CorporateAccountService';
import { corporateContactSchema } from '@/lib/utils/validation';

const corporateAccountService = new CorporateAccountService();

/**
 * GET /api/corporate/accounts/[id]/contacts
 * Get all contacts for a corporate account
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
      const contacts = await corporateAccountService.getContactsByAccount(id, user.tenantId);
      return successResponse(contacts);
    },
    {
      requireRole: ['owner', 'manager', 'staff'],
      rateLimit: true,
    }
  );
}

/**
 * POST /api/corporate/accounts/[id]/contacts
 * Create a new contact for a corporate account
 */
export async function POST(
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

      const validation = corporateContactSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const newContact = await corporateAccountService.createContact(
        id,
        user.tenantId,
        validation.data
      );
      
      return successResponse(newContact, 201);
    },
    {
      requireRole: ['owner', 'manager', 'staff'],
      rateLimit: true,
    }
  );
}

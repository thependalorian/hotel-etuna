/**
 * Corporate Account Bookings API Route
 * 
 * Purpose: Get all bookings for a corporate account
 * Location: /app/api/corporate/accounts/[id]/bookings/route.ts
 * 
 * Agent A7 - Corporate Billing Feature
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { CorporateAccountService } from '@/lib/services/crm/CorporateAccountService';

const corporateAccountService = new CorporateAccountService();

/**
 * GET /api/corporate/accounts/[id]/bookings
 * Get all bookings for a corporate account
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
      const bookings = await corporateAccountService.getBookingsByAccount(id, user.tenantId);
      return successResponse(bookings);
    },
    {
      requireRole: ['owner', 'manager', 'staff'],
      rateLimit: true,
    }
  );
}

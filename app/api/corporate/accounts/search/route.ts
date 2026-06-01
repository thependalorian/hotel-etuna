/**
 * Corporate Account Search API Route
 * 
 * Purpose: Search corporate accounts by company name (for autocomplete in walk-in form)
 * Location: /app/api/corporate/accounts/search/route.ts
 * 
 * Agent A7 - Corporate Billing Feature
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { CorporateAccountService } from '@/lib/services/crm/CorporateAccountService';

const corporateAccountService = new CorporateAccountService();

/**
 * GET /api/corporate/accounts/search?q=companyname
 * Search corporate accounts by name
 */
export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const searchParams = request.nextUrl.searchParams;
      const query = searchParams.get('q');

      if (!query || query.length < 2) {
        return errorResponse('Search query must be at least 2 characters', 400, 'INVALID_QUERY');
      }

      const accounts = await corporateAccountService.searchAccountsByName(
        user.tenantId,
        query
      );
      
      return successResponse(accounts);
    },
    {
      requireRole: ['owner', 'manager', 'staff'],
      rateLimit: true,
    }
  );
}

/**
 * @fileoverview API route //api/payments/namqr/pending
 * Location: /app/api/payments/namqr/pending/route.ts
 */

/**
 * GET /api/payments/namqr/pending — staff queue of guest NamQR claims (Option B)
 *
 * Query: status=pending|approved|rejected (default pending)
 * Response: { data: { items: [...] } }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { HospitalityNamQrPaymentService } from '@/lib/services/payment/HospitalityNamQrPaymentService';

const STATUSES = new Set(['pending', 'approved', 'rejected']);

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant required', 400, 'MISSING_TENANT');
      }

      const statusParam = req.nextUrl.searchParams.get('status') ?? 'pending';
      if (!STATUSES.has(statusParam)) {
        return errorResponse('Invalid status', 400, 'VALIDATION_ERROR');
      }

      const items = await HospitalityNamQrPaymentService.listPendingForTenant(
        user.tenantId,
        statusParam as 'pending' | 'approved' | 'rejected'
      );

      return successResponse({ items });
    },
    { requireRole: ['owner', 'manager', 'admin', 'staff'] }
  );
}

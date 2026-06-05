/**
 * POST /api/payments/namqr/generate — staff desk NamQR (BoN v5.0)
 * Location: app/api/payments/namqr/generate/route.ts
 *
 * Body: { amount?, bookingId?, purpose?, presentationMode?: 'static'|'dynamic' }
 * Response: { data: { qrReference, qrPayload, qrImageUrl, expiresAt? } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { HospitalityNamQrPaymentService } from '@/lib/services/payment/HospitalityNamQrPaymentService';
import { securityLogger } from '@/lib/utils/security-logger.client';

const bodySchema = z.object({
  amount: z.number().positive().optional(),
  bookingId: z.string().uuid().optional(),
  purpose: z.string().max(50).optional(),
  presentationMode: z.enum(['static', 'dynamic']).optional(),
});

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant required', 400, 'MISSING_TENANT');
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }

      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      const isDynamic =
        parsed.data.presentationMode === 'dynamic' || parsed.data.amount != null;

      try {
        const result = await HospitalityNamQrPaymentService.generateDeskQr({
          tenantId: user.tenantId,
          bookingId: parsed.data.bookingId,
          amount: isDynamic ? parsed.data.amount : undefined,
          purpose: parsed.data.purpose,
        });

        return successResponse({
          qrReference: result.qrReference,
          qrPayload: result.qrPayload,
          qrImageUrl: result.qrImageUrl,
          expiresAt: result.expiresAt?.toISOString(),
          bookingId: parsed.data.bookingId,
          settlement: result.settlement,
          regulatoryReference:
            'mba-agent/documents/mba-agent/regulatory/namibia/namibia_qr_code_standards.md v5.0',
        });
      } catch (e) {
        securityLogger.error('[namqr/generate]', e);
        return errorResponse('Failed to generate NamQR', 500, 'NAMQR_GENERATE_FAILED');
      }
    },
    { requireRole: ['owner', 'manager', 'admin', 'staff'] }
  );
}

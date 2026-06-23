/**
 * @fileoverview API route //api/payments/open-banking/initiate
 * Location: /app/api/payments/open-banking/initiate/route.ts
 */

/**
 * Hub Open Banking payment initiation
 *
 * Purpose: Staff/guest-facing payment start aligned with
 *   Namibian Open Banking PIS v1.0 (when OAuth consent + step-up 2FA present).
 * Location: app/api/payments/open-banking/initiate/route.ts
 *
 * Regulatory refs (mba-agent):
 * - namibia_open_banking_standards.md §9.2.5 — Make Payment (PIS)
 * - determination_of_the_operational_and_cybersecurity_standards.md — 2FA per initiation
 *
 * POST body:
 *   paymentRail: 'pis'
 *   bookingId?, amount
 *   // PIS only:
 *   accessToken, payerAccountId, payeeIdentifier, payeeName, payeeAccountType,
 *   paymentStream, authMethod, authValue
 *
 * Response (pis):  { data: { rail, paymentId, paymentReference, status, estimatedSettlement } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { PaymentInitiationService } from '@/lib/services/openbanking/PaymentInitiationService';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { securityLogger } from '@/lib/utils/security-logger';
import { entityId } from '@/lib/validation/entity-ids';

const pisBodySchema = z.object({
  paymentRail: z.literal('pis'),
  bookingId: entityId().optional(),
  amount: z.number().positive().max(1_000_000),
  accessToken: z.string().min(20),
  payerAccountId: entityId(),
  payeeIdentifier: z.string().min(3).max(128),
  payeeName: z.string().min(1).max(140),
  payeeAccountType: z.enum(['bank', 'ewallet', 'card']),
  paymentStream: z.enum(['NRTC', 'EnCR']),
  authMethod: z.enum(['otp_sms', 'biometric', 'app_pin']),
  authValue: z.string().min(4).max(256),
  description: z.string().max(500).optional(),
});

const bodySchema = pisBodySchema;

export const dynamic = 'force-dynamic';

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

      // PIS rail — PSD-12 / NPIF-CTL-2FA-01: 2FA validated inside PaymentInitiationService
      try {
        const pis = await PaymentInitiationService.makePayment({
          accessToken: parsed.data.accessToken,
          payerAccountId: parsed.data.payerAccountId,
          payeeIdentifier: parsed.data.payeeIdentifier,
          payeeName: parsed.data.payeeName,
          payeeAccountType: parsed.data.payeeAccountType,
          amount: parsed.data.amount,
          currency: 'NAD',
          description: parsed.data.description ?? 'Hotel Etuna open banking payment',
          paymentStream: parsed.data.paymentStream,
          authMethod: parsed.data.authMethod,
          authValue: parsed.data.authValue,
        });

        await recordAuditTrail({
          tenantId: user.tenantId,
          userId: user.id,
          action: 'payments.open_banking.pis_initiated',
          resourceType: 'transaction',
          resourceId: pis.data.paymentId,
          newValues: {
            amount: parsed.data.amount,
            paymentStream: parsed.data.paymentStream,
            bookingId: parsed.data.bookingId,
          },
        });

        return successResponse({
          rail: 'pis',
          ...pis.data,
          statusUrl: `/api/bon/v1/banking/payments/${pis.data.paymentId}/status`,
          regulatoryReference:
            'mba-agent/regulatory/namibia/namibia_open_banking_standards.md §9.2.5',
        }, 201);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'PIS initiation failed';
        securityLogger.error('[open-banking/initiate] pis', { message });
        const status = message.includes('AUTHENTICATION_FAILED') ? 403 : 400;
        return errorResponse(message, status, 'PIS_INITIATION_FAILED');
      }
    },
    { rateLimit: true, requireRole: ['owner', 'manager', 'admin', 'staff'] }
  );
}

export async function GET() {
  return successResponse({
    rails: {
      pis: {
        standard: 'Namibian Open Banking Standards v1.0 — Make Payment',
        doc: 'mba-agent/regulatory/namibia/namibia_open_banking_standards.md',
        oauth: {
          par: '/api/bon/v1/common/par',
          token: '/api/bon/v1/common/token',
        },
        pis: {
          makePayment: '/api/bon/v1/banking/payments',
          paymentStatus: '/api/bon/v1/banking/payments/{id}/status',
          beneficiaries: '/api/bon/v1/banking/beneficiaries',
        },
        requires2FA: true,
        paymentRail: 'pis',
      },
    },
  });
}

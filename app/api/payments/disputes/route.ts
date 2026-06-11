/**
 * Payment disputes — list + open (chargeback / refund / reversal).
 * Location: app/api/payments/disputes/route.ts
 *
 * GET  /api/payments/disputes?status=opened   → tenant disputes (newest first)
 * POST /api/payments/disputes                 → open a dispute (reverses the folio)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import {
  PaymentDisputeService,
  type DisputeStatus,
} from '@/lib/services/payment/PaymentDisputeService';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';

const MONEY_ROLES = new Set(['owner', 'founder', 'admin', 'manager', 'partner_admin']);

const createSchema = z.object({
  amount: z.number().positive(),
  kind: z.enum(['chargeback', 'refund', 'reversal']).optional(),
  bookingId: z.string().uuid().optional(),
  transactionId: z.string().uuid().optional(),
  guestId: z.string().uuid().optional(),
  merchantReference: z.string().max(38).optional(),
  gatewayTransactionId: z.string().max(255).optional(),
  reasonCode: z.string().max(50).optional(),
  reason: z.string().max(2000).optional(),
  currency: z.string().length(3).optional(),
});

export async function GET(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      const status = new URL(req.url).searchParams.get('status') as DisputeStatus | null;
      const disputes = await PaymentDisputeService.list(user.tenantId, status ?? undefined);
      return NextResponse.json({ disputes });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      securityLogger.error('[disputes GET]', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      if (!MONEY_ROLES.has(user.role)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const parsed = createSchema.safeParse(await req.json());
      if (!parsed.success) {
        return NextResponse.json(
          { message: 'Invalid input', errors: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const result = await PaymentDisputeService.openDispute({
        tenantId: user.tenantId,
        userId: user.id,
        ...parsed.data,
      });

      return NextResponse.json(
        { dispute: result },
        { status: result.alreadyOpen ? 200 : 201 },
      );
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      securityLogger.error('[disputes POST]', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  });
}

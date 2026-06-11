/**
 * Payment dispute — resolve (won / lost / refunded / reversed / under_review).
 * Location: app/api/payments/disputes/[id]/route.ts
 *
 * PATCH /api/payments/disputes/:id  { status, note? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { PaymentDisputeService } from '@/lib/services/payment/PaymentDisputeService';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';

const MONEY_ROLES = new Set(['owner', 'founder', 'admin', 'manager', 'partner_admin']);

const resolveSchema = z.object({
  status: z.enum(['under_review', 'won', 'lost', 'refunded', 'reversed']),
  note: z.string().max(2000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      if (!MONEY_ROLES.has(user.role)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const { id } = await params;
      const parsed = resolveSchema.safeParse(await req.json());
      if (!parsed.success) {
        return NextResponse.json(
          { message: 'Invalid input', errors: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const ok = await PaymentDisputeService.resolveDispute({
        id,
        tenantId: user.tenantId,
        status: parsed.data.status,
        note: parsed.data.note,
        userId: user.id,
      });

      if (!ok) {
        return NextResponse.json({ message: 'Dispute not found' }, { status: 404 });
      }

      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      securityLogger.error('[disputes PATCH]', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  });
}

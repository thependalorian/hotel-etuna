/**
 * @fileoverview API route //api/restaurant/orders/[id]/status
 * Location: /app/api/restaurant/orders/[id]/status/route.ts
 */

/**
 * Restaurant order status transitions (kitchen workflow)
 *
 * Purpose: LangGraph-validated F&B order lifecycle
 * Location: /app/api/restaurant/orders/[id]/status/route.ts
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { OrderService } from '@/lib/services/restaurant/OrderService';
import { entityStatusTransitionSchema } from '@/lib/utils/validation';
import { AppError } from '@/lib/utils/errors';

const orderService = new OrderService();

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }
      const parsed = entityStatusTransitionSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }
      try {
        const order = await orderService.transitionOrderStatus(
          id,
          user.tenantId,
          parsed.data.status
        );
        return successResponse({
          order,
          workflow: { kind: 'restaurant_order_lifecycle', targetStatus: parsed.data.status },
        });
      } catch (e) {
        if (e instanceof AppError) {
          return errorResponse(e.message, e.statusCode, 'ORDER_TRANSITION');
        }
        throw e;
      }
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

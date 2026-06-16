/**
 * @fileoverview API route //api/inventory/items
 * Location: /app/api/inventory/items/route.ts
 */

/**
 * GET /api/inventory/items?restaurantId=
 * PATCH /api/inventory/items — manual stock adjustment
 * Location: app/api/inventory/items/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { inventoryService } from '@/lib/services/inventory/InventoryService';
import { AppError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      try {
        if (!user.tenantId) {
          return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const { searchParams } = new URL(req.url);
        const restaurantId = searchParams.get('restaurantId');
        if (!restaurantId) {
          return errorResponse('restaurantId is required', 400, 'VALIDATION_ERROR');
        }

        const items = await inventoryService.listByRestaurant(user.tenantId, restaurantId);
        return successResponse({ items });
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'APP_ERROR');
        }
        return errorResponse('Failed to load inventory', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

export async function PATCH(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      try {
        if (!user.tenantId || !user.id) {
          return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const body = (await req.json()) as {
          inventoryItemId?: string;
          quantityDelta?: number;
          notes?: string;
        };

        if (!body.inventoryItemId || body.quantityDelta == null) {
          return errorResponse(
            'inventoryItemId and quantityDelta are required',
            400,
            'VALIDATION_ERROR'
          );
        }

        const result = await inventoryService.adjustStock({
          inventoryItemId: body.inventoryItemId,
          quantityDelta: body.quantityDelta,
          notes: body.notes,
          createdBy: user.id,
        });

        return successResponse(result);
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'APP_ERROR');
        }
        return errorResponse('Failed to adjust stock', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

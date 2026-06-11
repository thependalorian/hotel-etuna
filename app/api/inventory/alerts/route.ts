/**
 * GET /api/inventory/alerts?restaurantId=
 * Location: app/api/inventory/alerts/route.ts
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

        const alerts = await inventoryService.listOpenAlerts(user.tenantId, restaurantId);
        return successResponse({ alerts });
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'APP_ERROR');
        }
        return errorResponse('Failed to load stock alerts', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

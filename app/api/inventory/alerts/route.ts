/**
 * GET /api/inventory/alerts?restaurantId=
 * Location: app/api/inventory/alerts/route.ts
 *
 * Response: { alerts: StockAlertRow[] }
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { inventoryService } from '@/lib/services/inventory/InventoryService';
import { errorResponse } from '@/lib/utils/api-helpers';
import { AppError } from '@/lib/utils/errors';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    if (!restaurantId) {
      return errorResponse('restaurantId is required', 400);
    }

    const alerts = await inventoryService.listOpenAlerts(session.user.tenantId, restaurantId);
    return NextResponse.json({ alerts });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Failed to load stock alerts', 500);
  }
}

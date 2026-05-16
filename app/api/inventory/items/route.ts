/**
 * GET /api/inventory/items?restaurantId=
 * PATCH /api/inventory/items — manual stock adjustment
 * Location: app/api/inventory/items/route.ts
 *
 * Response (GET): { items: InventoryListItem[] }
 * Response (PATCH): { quantityOnHand: number }
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

    const items = await inventoryService.listByRestaurant(session.user.tenantId, restaurantId);
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Failed to load inventory', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return errorResponse('Unauthorized', 401);
    }

    const body = (await request.json()) as {
      inventoryItemId?: string;
      quantityDelta?: number;
      notes?: string;
    };

    if (!body.inventoryItemId || body.quantityDelta == null) {
      return errorResponse('inventoryItemId and quantityDelta are required', 400);
    }

    const result = await inventoryService.adjustStock({
      inventoryItemId: body.inventoryItemId,
      quantityDelta: body.quantityDelta,
      notes: body.notes,
      createdBy: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Failed to adjust stock', 500);
  }
}

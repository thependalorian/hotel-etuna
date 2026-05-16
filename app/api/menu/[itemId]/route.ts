/**
 * Single menu item API
 * Location: app/api/menu/[itemId]/route.ts
 *
 * GET: fetch one menu item (tenant-scoped)
 * PATCH: update name, description, price, image, availability (tenant-scoped)
 * DELETE: remove menu item (tenant-scoped)
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { MenuService } from '@/lib/services/menu/MenuService';
import { entityId } from '@/lib/validation/entity-ids';
import * as z from 'zod';

const menuService = new MenuService();

const patchMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  category: z.string().min(1).optional(),
  imageUrl: z.union([z.string().url(), z.literal('')]).nullable().optional(),
  isAvailable: z.boolean().optional(),
  dietary: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const { itemId } = await params;
      const idCheck = entityId('Invalid menu item ID').safeParse(itemId);
      if (!idCheck.success) {
        return errorResponse('Invalid menu item ID', 400, 'VALIDATION_ERROR');
      }

      try {
        const item = await menuService.getMenuItemById(itemId, user.tenantId);
        if (!item) {
          return errorResponse('Menu item not found', 404, 'NOT_FOUND');
        }
        return successResponse(item);
      } catch (error: unknown) {
        console.error('[GET /api/menu/[itemId]]', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    },
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const { itemId } = await params;
      const idCheck = entityId('Invalid menu item ID').safeParse(itemId);
      if (!idCheck.success) {
        return errorResponse('Invalid menu item ID', 400, 'VALIDATION_ERROR');
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = patchMenuItemSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors,
        );
      }

      const data = validation.data;
      const imageUrl =
        data.imageUrl === undefined
          ? undefined
          : data.imageUrl === '' || data.imageUrl === null
            ? null
            : data.imageUrl;

      try {
        const updated = await menuService.updateMenuItem(itemId, user.tenantId, {
          name: data.name,
          description: data.description ?? undefined,
          price: data.price,
          isAvailable: data.isAvailable,
          allergens: data.allergens,
          dietary: data.dietary,
          imageUrl,
        });
        return successResponse(updated);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message.includes('not found')) {
          return errorResponse('Menu item not found', 404, 'NOT_FOUND');
        }
        console.error('[PATCH /api/menu/[itemId]]', error);
        return errorResponse(message, 500, 'INTERNAL_ERROR');
      }
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    },
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const { itemId } = await params;
      const idCheck = entityId('Invalid menu item ID').safeParse(itemId);
      if (!idCheck.success) {
        return errorResponse('Invalid menu item ID', 400, 'VALIDATION_ERROR');
      }

      try {
        await menuService.deleteMenuItem(itemId, user.tenantId);
        return successResponse({ deleted: true });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message.includes('not found')) {
          return errorResponse('Menu item not found', 404, 'NOT_FOUND');
        }
        console.error('[DELETE /api/menu/[itemId]]', error);
        return errorResponse(message, 500, 'INTERNAL_ERROR');
      }
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    },
  );
}

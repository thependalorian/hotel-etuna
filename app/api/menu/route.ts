/**
 * Menu API Route
 * 
 * Purpose: Manage menu items with system design principles
 * Location: /app/api/menu/route.ts
 * 
 * Implements:
 * - Authentication & authorization
 * - Rate limiting
 * - Tenant isolation
 * - Input validation
 * - Error handling
 * - Query parameter filtering
 * 
 * Following System Design Principles:
 * - API Design Best Practices
 * - Security Architecture
 * - Multi-Tenancy Strategy
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { MenuService } from '@/lib/services/menu/MenuService';
import { entityId, entityIdOptional } from '@/lib/validation/entity-ids';
import * as z from 'zod';

const menuService = new MenuService();

const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Menu item name is required'),
  description: z.string().optional(),
  price: z.number().min(0),
  category: z.string().min(1, 'Category is required'),
  propertyId: entityId(),
  property_id: entityIdOptional(),
  imageUrl: z.union([z.string().url(), z.literal('')]).optional(),
});

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.id || !user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      let body;
      try {
        body = await request.json();
      } catch (error) {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = createMenuItemSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      try {
        // Ensure propertyId is included in the data
        const menuItemData = {
          name: validation.data.name,
          description: validation.data.description,
          category: validation.data.category,
          price: validation.data.price,
          propertyId: validation.data.propertyId || (validation.data as { property_id?: string }).property_id,
          imageUrl: validation.data.imageUrl?.trim() || null,
        };
        const newMenuItem = await menuService.createMenuItem(
          user.tenantId,
          menuItemData
        );
        return successResponse(newMenuItem, 201);
      } catch (error: any) {
        console.error('Error creating menu item:', error);
        return errorResponse(
          error.message || 'Internal server error',
          500,
          'INTERNAL_ERROR'
        );
      }
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const query = searchParams.get('query') || '';
        const category = searchParams.get('category') || undefined;

        if (propertyId) {
          const menuItems = await menuService.getMenuItemsByProperty(propertyId, user.tenantId);
          return successResponse(menuItems);
        } else if (query || category) {
          const filters = {
            category,
          };
          const menuItems = await menuService.searchMenuItems(user.tenantId, query, filters);
          return successResponse(menuItems);
        } else {
          const stats = await menuService.getMenuStats(user.tenantId);
          return successResponse(stats);
        }
      } catch (error: any) {
        console.error('Error fetching menu items:', error);
        return errorResponse(
          error.message || 'Internal server error',
          500,
          'INTERNAL_ERROR'
        );
      }
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

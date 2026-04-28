/**
 * Restaurant Menu API Route
 * 
 * Purpose: Manage restaurant menu (categories and items) with system design principles
 * Location: /app/api/restaurant/menu/route.ts
 * 
 * Implements:
 * - Authentication & authorization
 * - Rate limiting
 * - Tenant isolation
 * - Input validation
 * - Error handling
 * 
 * Following System Design Principles:
 * - API Design Best Practices
 * - Security Architecture
 * - Multi-Tenancy Strategy
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { MenuService } from '@/lib/services/menu/MenuService';
import { createMenuItemSchema, createMenuCategorySchema } from '@/lib/utils/validation';
import { db, restaurants as restaurantsSchema, properties as propertiesSchema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { entityId } from '@/lib/validation/entity-ids';
import * as z from 'zod';

const menuService = new MenuService();

const restaurantMenuPostSchema = z.object({
  type: z.enum(['category', 'item']),
  restaurantId: entityId('Invalid restaurant ID'),
  propertyId: entityId('Invalid property ID'),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { searchParams } = new URL(req.url);
      const restaurantId = searchParams.get('restaurantId');

      if (!restaurantId) {
        return errorResponse('Missing restaurantId parameter', 400, 'MISSING_RESTAURANT_ID');
      }

      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      // Verify that the restaurant belongs to the tenant
      const restaurantCheck = await db
        .select()
        .from(restaurantsSchema)
        .leftJoin(propertiesSchema, eq(restaurantsSchema.propertyId, propertiesSchema.id))
        .where(and(eq(restaurantsSchema.id, restaurantId), eq(propertiesSchema.tenantId, user.tenantId)));

      if (restaurantCheck.length === 0) {
        return errorResponse('Restaurant not found or does not belong to tenant', 404, 'RESTAURANT_NOT_FOUND');
      }

      const categories = await menuService.getMenuCategoriesByRestaurant(restaurantId);
      const items = await menuService.getMenuItemsByRestaurant(restaurantId);

      // Group items by category
      const menu = categories.map(category => ({
        ...category,
        items: items.filter(item => item.categoryId === category.id),
      }));

      return successResponse(menu);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      let body;
      try {
        body = await request.json();
      } catch (error) {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const { type, restaurantId, propertyId, ...data } = body;

      // Validate required fields
      const baseValidation = restaurantMenuPostSchema.safeParse({ type, restaurantId, propertyId });
      if (!baseValidation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          baseValidation.error.flatten().fieldErrors
        );
      }

      // Verify that the restaurant belongs to the tenant
      const restaurantCheck = await db
        .select()
        .from(restaurantsSchema)
        .leftJoin(propertiesSchema, eq(restaurantsSchema.propertyId, propertiesSchema.id))
        .where(and(eq(restaurantsSchema.id, restaurantId), eq(propertiesSchema.tenantId, user.tenantId)));

      if (restaurantCheck.length === 0) {
        return errorResponse('Restaurant not found or does not belong to tenant', 404, 'RESTAURANT_NOT_FOUND');
      }

      if (type === 'category') {
        const validatedData = createMenuCategorySchema.safeParse({ restaurantId, ...data });
        if (!validatedData.success) {
          return errorResponse(
            'Invalid category data',
            400,
            'VALIDATION_ERROR',
            validatedData.error.flatten().fieldErrors
          );
        }
        const newCategory = await menuService.createRestaurantMenuCategory(user.tenantId, restaurantId, validatedData.data);
        return successResponse(newCategory, 201);
      } else if (type === 'item') {
        const validatedData = createMenuItemSchema.safeParse({ restaurantId, ...data });
        if (!validatedData.success) {
          return errorResponse(
            'Invalid menu item data',
            400,
            'VALIDATION_ERROR',
            validatedData.error.flatten().fieldErrors
          );
        }
        const newItem = await menuService.createRestaurantMenuItem(user.tenantId, propertyId, validatedData.data);
        return successResponse(newItem, 201);
      } else {
        return errorResponse('Invalid type for menu creation. Must be "category" or "item"', 400, 'INVALID_TYPE');
      }
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

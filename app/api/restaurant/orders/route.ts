/**
 * Restaurant Orders API Route
 * 
 * Purpose: Manage restaurant orders with system design principles
 * Location: /app/api/restaurant/orders/route.ts
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
import { OrderService } from '@/lib/services/restaurant/OrderService';
import { GuestService } from '@/lib/services/booking/GuestService';
import { createOrderSchema } from '@/lib/utils/validation';
import { db, restaurants as restaurantsSchema, properties as propertiesSchema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';

const orderService = new OrderService();
const guestService = new GuestService();

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

      const orders = await orderService.getOrdersByRestaurant(restaurantId);
      return successResponse(orders);
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

      const validation = createOrderSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      // Verify that the restaurant belongs to the tenant
      const restaurantCheck = await db
        .select()
        .from(restaurantsSchema)
        .leftJoin(propertiesSchema, eq(restaurantsSchema.propertyId, propertiesSchema.id))
        .where(and(eq(restaurantsSchema.id, validation.data.restaurantId), eq(propertiesSchema.tenantId, user.tenantId)));

      if (restaurantCheck.length === 0) {
        return errorResponse('Restaurant not found or does not belong to tenant', 404, 'RESTAURANT_NOT_FOUND');
      }

      // Ensure guest exists or create a new one if not already associated with the user
      let guestId = validation.data.guestId;
      const existingGuest = await guestService.getGuestById(guestId, user.tenantId).catch(() => null);

      if (!existingGuest) {
        // If guestId is not found, try to create a new guest using user's info
        const newGuest = await guestService.createGuest(user.tenantId, {
          email: (user as any).primaryEmail || user.email || '',
          firstName: (user as any).displayName?.split(' ')[0] || '',
          lastName: (user as any).displayName?.split(' ').slice(1).join(' ') || '',
          isSignedUp: true,
        });
        guestId = newGuest.id;
      }

      const newOrder = await orderService.createOrder(user.tenantId, {
        ...validation.data,
        guestId,
      });

      return successResponse(newOrder, 201);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

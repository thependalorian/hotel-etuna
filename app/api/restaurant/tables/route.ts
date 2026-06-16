/**
 * @fileoverview API route //api/restaurant/tables
 * Location: /app/api/restaurant/tables/route.ts
 */

/**
 * Restaurant Tables API Route
 * 
 * Purpose: Manage restaurant tables with system design principles
 * Location: /app/api/restaurant/tables/route.ts
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
import { TableService } from '@/lib/services/restaurant/TableService';
import { createTableSchema } from '@/lib/utils/validation';
import { db, restaurants as restaurantsSchema, properties as propertiesSchema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';

const tableService = new TableService();

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

      const tables = await tableService.getTablesByRestaurant(restaurantId);
      return successResponse(tables);
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

      const validation = createTableSchema.safeParse(body);
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

      const newTable = await tableService.createTable(user.tenantId, validation.data);
      return successResponse(newTable, 201);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

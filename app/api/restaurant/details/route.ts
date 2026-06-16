/**
 * @fileoverview API route //api/restaurant/details
 * Location: /app/api/restaurant/details/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { PropertyService } from '@/lib/services/property/PropertyService';
import { db, restaurants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

const propertyService = new PropertyService();

export async function GET(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const { searchParams } = new URL(req.url);
      const propertyId = searchParams.get('propertyId');

      if (!propertyId) {
        return errorResponse('Missing propertyId parameter', 400, 'VALIDATION_ERROR');
      }

      try {
        const property = await propertyService.getPropertyById(propertyId, user.tenantId);
        if (!property) {
          return errorResponse('Property not found or does not belong to tenant', 404, 'NOT_FOUND');
        }

        const rows = await db
          .select()
          .from(restaurants)
          .where(eq(restaurants.propertyId, propertyId))
          .limit(1);
        const restaurant = rows[0];

        if (!restaurant) {
          return errorResponse('Restaurant not found for this property', 404, 'NOT_FOUND');
        }

        return successResponse({
          id: restaurant.id,
          propertyId: restaurant.propertyId,
          name: restaurant.name,
          cuisine: restaurant.cuisineType || 'International',
          description: restaurant.description || '',
          openingHours: restaurant.openingHours || {},
          capacity: restaurant.capacity,
          contactPhone: restaurant.contactPhone,
          contactEmail: restaurant.contactEmail,
          images: restaurant.images || [],
          status: restaurant.status,
          createdAt: restaurant.createdAt?.toISOString?.() ?? new Date().toISOString(),
          updatedAt: restaurant.updatedAt?.toISOString?.() ?? new Date().toISOString(),
        });
      } catch (error) {
        securityLogger.error('Error fetching restaurant details:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

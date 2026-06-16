/**
 * @fileoverview API route //api/crm/reviews
 * Location: /app/api/crm/reviews/route.ts
 */

/**
 * Guest Reviews API Endpoint
 *
 * Purpose: Fetch all guest reviews for admin management
 * Location: app/api/crm/reviews/route.ts
 * Method: GET
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
} from '@/lib/utils/api-helpers';
import { db, guestReviews, guests, properties, and, desc, eq } from '@/lib/db';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (_req, user) => {
      try {
        if (!user.tenantId) {
          return errorResponse('Missing tenant context', 400, 'VALIDATION_ERROR');
        }

        const allReviews = await db
          .select({
            id: guestReviews.id,
            rating: guestReviews.rating,
            reviewText: guestReviews.reviewText,
            reviewCategory: guestReviews.reviewCategory,
            isPublic: guestReviews.isPublic,
            createdAt: guestReviews.createdAt,
            updatedAt: guestReviews.updatedAt,
            guest: {
              id: guests.id,
              firstName: guests.firstName,
              lastName: guests.lastName,
              city: guests.city,
              country: guests.country,
            },
            property: {
              id: properties.id,
              name: properties.name,
            },
          })
          .from(guestReviews)
          .leftJoin(guests, eq(guestReviews.guestId, guests.id))
          .leftJoin(properties, eq(guestReviews.propertyId, properties.id))
          .where(and(eq(guestReviews.tenantId, user.tenantId)))
          .orderBy(desc(guestReviews.createdAt));

        // Reason: consumers (crm/reviews/page.tsx, crm/page.tsx) and integration tests read
        // top-level `reviews`/`count`. Do not wrap in the successResponse `data` envelope here.
        return NextResponse.json({
          reviews: allReviews,
          count: allReviews.length,
        });
      } catch (error: unknown) {
        securityLogger.error('[GET /api/crm/reviews] Error:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

/**
 * Guest Reviews API Endpoint
 * 
 * Purpose: Fetch all guest reviews for admin management
 * Location: app/api/crm/reviews/route.ts
 * Method: GET
 * 
 * Features:
 * - Authentication required
 * - Returns all reviews with guest and property data
 * - Ordered by creation date (newest first)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db, guestReviews, guests, properties, and, desc, eq } from '@/lib/db';
import { securityLogger } from '@/lib/utils/security-logger.client';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant context' },
        { status: 400 }
      );
    }

    // Fetch tenant-scoped reviews with guest and property data
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
      .where(and(eq(guestReviews.tenantId, session.user.tenantId)))
      .orderBy(desc(guestReviews.createdAt));

    return NextResponse.json({
      success: true,
      reviews: allReviews,
      count: allReviews.length,
    });

  } catch (error: unknown) {
    securityLogger.error('[GET /api/crm/reviews] Error:', error);
    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      return NextResponse.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

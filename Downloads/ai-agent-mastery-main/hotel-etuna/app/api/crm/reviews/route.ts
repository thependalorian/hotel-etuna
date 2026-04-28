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
import { db, guestReviews, guests, properties, desc, eq } from '@/lib/db';

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

    // Fetch all reviews with guest and property data
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
      .orderBy(desc(guestReviews.createdAt));

    return NextResponse.json({
      success: true,
      reviews: allReviews,
      count: allReviews.length,
    });

  } catch (error: any) {
    console.error('[GET /api/crm/reviews] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

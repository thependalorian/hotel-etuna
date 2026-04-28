/**
 * Guest Review Approval API Endpoint
 * 
 * Purpose: Toggle public visibility of guest reviews
 * Location: app/api/crm/reviews/[id]/route.ts
 * Method: PATCH
 * 
 * Features:
 * - Authentication required
 * - Role-based access (owner, manager, admin only)
 * - Updates is_public boolean flag
 * - Returns updated review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db, guestReviews, eq } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+)
    const { id: reviewId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Check role-based authorization
    const allowedRoles = ['owner', 'manager', 'admin'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { is_public } = body;

    // Validate input
    if (typeof is_public !== 'boolean') {
      return NextResponse.json(
        { error: 'Bad Request - is_public must be a boolean' },
        { status: 400 }
      );
    }

    // Update the review
    const [updatedReview] = await db
      .update(guestReviews)
      .set({ 
        isPublic: is_public,
        updatedAt: new Date(),
      })
      .where(eq(guestReviews.id, reviewId))
      .returning();

    if (!updatedReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: is_public
        ? 'Review approved and is now public'
        : 'Review hidden from public view',
    });

  } catch (error: any) {
    console.error('[PATCH /api/crm/reviews/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+)
    const { id: reviewId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Fetch the review
    const review = await db.query.guestReviews.findFirst({
      where: eq(guestReviews.id, reviewId),
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ review });

  } catch (error: any) {
    console.error('[GET /api/crm/reviews/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

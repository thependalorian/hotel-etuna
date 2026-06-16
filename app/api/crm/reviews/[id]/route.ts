/**
 * @fileoverview API route //api/crm/reviews/[id]
 * Location: /app/api/crm/reviews/[id]/route.ts
 */

/**
 * Guest Review Approval API Endpoint
 *
 * Purpose: Toggle public visibility of guest reviews
 * Location: app/api/crm/reviews/[id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
} from '@/lib/utils/api-helpers';
import { db, guestReviews, and, eq } from '@/lib/db';
import { securityLogger } from '@/lib/utils/security-logger';

const REVIEW_MANAGER_ROLES = ['owner', 'manager', 'admin'] as const;

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      try {
        const { id: reviewId } = await params;

        const body = await req.json();
        const { is_public } = body;

        if (typeof is_public !== 'boolean') {
          return errorResponse('is_public must be a boolean', 400, 'VALIDATION_ERROR');
        }

        if (!user.tenantId) {
          return errorResponse('Missing tenant context', 400, 'VALIDATION_ERROR');
        }

        const [updatedReview] = await db
          .update(guestReviews)
          .set({
            isPublic: is_public,
            updatedAt: new Date(),
          })
          .where(and(eq(guestReviews.id, reviewId), eq(guestReviews.tenantId, user.tenantId)))
          .returning();

        if (!updatedReview) {
          return errorResponse('Review not found', 404, 'NOT_FOUND');
        }

        // Reason: consumers read top-level `review`; keep the original contract (not the
        // successResponse `data` envelope) so the moderation UI and tests stay in sync.
        return NextResponse.json({
          review: updatedReview,
          message: is_public
            ? 'Review approved and is now public'
            : 'Review hidden from public view',
        });
      } catch (error: unknown) {
        securityLogger.error('[PATCH /api/crm/reviews/[id]] Error:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true, requireRole: [...REVIEW_MANAGER_ROLES] }
  );
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withPlatformApiAuth(
    request,
    async (_req, user) => {
      try {
        const { id: reviewId } = await params;

        const review = await db.query.guestReviews.findFirst({
          where: user.tenantId
            ? and(eq(guestReviews.id, reviewId), eq(guestReviews.tenantId, user.tenantId))
            : eq(guestReviews.id, reviewId),
        });

        if (!review) {
          return errorResponse('Review not found', 404, 'NOT_FOUND');
        }

        return NextResponse.json({ review });
      } catch (error: unknown) {
        securityLogger.error('[GET /api/crm/reviews/[id]] Error:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

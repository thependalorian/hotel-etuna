/**
 * Introducers API Route
 * 
 * Purpose: CRUD operations for introducer partners
 * Location: /app/api/introducers/route.ts
 * 
 * Implements:
 * - GET: List all introducers for tenant
 * - POST: Create new introducer
 * - Authentication & authorization (staff-only)
 * - Tenant isolation
 * - Input validation
 * 
 * Following System Design Principles:
 * - Part 3: API Design Best Practices
 * - Part 6: Authorization (staff-only)
 * - Part 1: Parameterized queries
 * - Part 11 Gap 4: Ownership checks
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { createIntroducerSchema } from '@/lib/utils/validation';
import { db, introducers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const allIntroducers = await db
        .select({
          id: introducers.id,
          name: introducers.name,
          code: introducers.code,
          email: introducers.email,
          phone: introducers.phone,
          commission_rate: introducers.commissionRate,
          is_active: introducers.isActive,
          show_in_public_directory: introducers.showInPublicDirectory,
          total_bookings: introducers.totalBookings,
          total_commission_earned: introducers.totalCommissionEarned,
          created_at: introducers.createdAt,
        })
        .from(introducers)
        .where(eq(introducers.tenantId, user.tenantId))
        .orderBy(introducers.name);

      return successResponse(allIntroducers);
    },
    {
      requireRole: ['owner', 'manager', 'admin', 'desk'],
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

      const validation = createIntroducerSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const data = validation.data;

      const codeUpper = data.code.toUpperCase();
      const existing = await db
        .select({ id: introducers.id })
        .from(introducers)
        .where(eq(introducers.code, codeUpper))
        .limit(1);

      if (existing.length > 0) {
        return errorResponse(
          'Introducer code already exists',
          409,
          'CODE_EXISTS'
        );
      }

      const [newIntroducer] = await db
        .insert(introducers)
        .values({
          tenantId: user.tenantId,
          propertyId: data.propertyId || null,
          name: data.name,
          code: codeUpper,
          email: data.email || null,
          phone: data.phone || null,
          commissionRate: data.commissionRate.toString(),
          isActive: data.isActive ?? true,
          showInPublicDirectory: data.showInPublicDirectory ?? false,
          bio: data.bio || null,
          website: data.website || null,
          logoUrl: data.logoUrl || null,
        })
        .returning();

      return successResponse(newIntroducer, 201);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

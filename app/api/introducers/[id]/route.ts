/**
 * Introducer Detail API Route
 * 
 * Purpose: Get, update, delete specific introducer
 * Location: /app/api/introducers/[id]/route.ts
 * 
 * Implements:
 * - GET: Fetch introducer by ID
 * - PATCH: Update introducer
 * - DELETE: Delete introducer
 * - Ownership verification (Part 11 Gap 4)
 * 
 * Following System Design Principles:
 * - Part 6: Authorization and ownership checks
 * - Part 1: Parameterized queries
 * - Part 3: RESTful API design
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { updateIntroducerSchema } from '@/lib/utils/validation';
import { db, introducers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const [introducer] = await db
        .select()
        .from(introducers)
        .where(
          and(
            eq(introducers.id, params.id),
            eq(introducers.tenantId, user.tenantId)
          )
        )
        .limit(1);

      if (!introducer) {
        return errorResponse('Introducer not found', 404, 'NOT_FOUND');
      }

      return successResponse(introducer);
    },
    {
      requireRole: ['owner', 'manager', 'admin', 'desk'],
      rateLimit: true,
    }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const [existing] = await db
        .select({ id: introducers.id, tenantId: introducers.tenantId })
        .from(introducers)
        .where(eq(introducers.id, params.id))
        .limit(1);

      if (!existing) {
        return errorResponse('Introducer not found', 404, 'NOT_FOUND');
      }

      if (existing.tenantId !== user.tenantId) {
        return errorResponse('Access denied', 403, 'FORBIDDEN');
      }

      let body;
      try {
        body = await request.json();
      } catch (error) {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = updateIntroducerSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const data = validation.data;
      const updateData: any = { updatedAt: new Date() };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.code !== undefined) updateData.code = data.code.toUpperCase();
      if (data.email !== undefined) updateData.email = data.email || null;
      if (data.phone !== undefined) updateData.phone = data.phone || null;
      if (data.commissionRate !== undefined) updateData.commissionRate = data.commissionRate.toString();
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.showInPublicDirectory !== undefined) updateData.showInPublicDirectory = data.showInPublicDirectory;
      if (data.bio !== undefined) updateData.bio = data.bio || null;
      if (data.website !== undefined) updateData.website = data.website || null;

      const [updated] = await db
        .update(introducers)
        .set(updateData)
        .where(eq(introducers.id, params.id))
        .returning();

      return successResponse(updated);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const [existing] = await db
        .select({ id: introducers.id, tenantId: introducers.tenantId })
        .from(introducers)
        .where(eq(introducers.id, params.id))
        .limit(1);

      if (!existing) {
        return errorResponse('Introducer not found', 404, 'NOT_FOUND');
      }

      if (existing.tenantId !== user.tenantId) {
        return errorResponse('Access denied', 403, 'FORBIDDEN');
      }

      await db
        .delete(introducers)
        .where(eq(introducers.id, params.id));

      return successResponse({ success: true });
    },
    {
      requireRole: ['owner', 'admin'],
      rateLimit: true,
    }
  );
}

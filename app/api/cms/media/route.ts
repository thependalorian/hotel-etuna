/**
 * CMS Media API Route
 * 
 * Purpose: Manage CMS media (images, files) with system design principles
 * Location: /app/api/cms/media/route.ts
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
import { MediaService } from '@/lib/services/cms/MediaService';
import { createCmsMediaSchema } from '@/lib/utils/validation';
import { db } from '@/lib/db';
import { properties } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

const mediaService = new MediaService();

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { searchParams } = new URL(req.url);
      const propertyId = searchParams.get('propertyId');

      if (!propertyId) {
        return errorResponse('Missing propertyId parameter', 400, 'MISSING_PROPERTY_ID');
      }

      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const [propertyCheck] = await db
        .select({ id: properties.id })
        .from(properties)
        .where(and(eq(properties.id, propertyId), eq(properties.tenantId, user.tenantId!)))
        .limit(1);

      if (!propertyCheck) {
        return errorResponse('Property not found or does not belong to tenant', 404, 'PROPERTY_NOT_FOUND');
      }

      const media = await mediaService.getMediaByProperty(propertyId, user.tenantId);
      return successResponse(media);
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

      const validation = createCmsMediaSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const [propertyCheck] = await db
        .select({ id: properties.id })
        .from(properties)
        .where(and(eq(properties.id, validation.data.propertyId), eq(properties.tenantId, user.tenantId)))
        .limit(1);

      if (!propertyCheck) {
        return errorResponse('Property not found or does not belong to tenant', 404, 'PROPERTY_NOT_FOUND');
      }

      const newMedia = await mediaService.createMedia(user.tenantId, {
        ...validation.data,
        metadata: validation.data.metadata ?? undefined,
      });
      return successResponse(newMedia, 201);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}
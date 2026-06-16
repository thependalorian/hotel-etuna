/**
 * @fileoverview API route //api/cms/content
 * Location: /app/api/cms/content/route.ts
 */

/**
 * CMS Content API Route
 * 
 * Purpose: Manage CMS content (property descriptions, room content, service descriptions)
 * Location: /app/api/cms/content/route.ts
 * 
 * Implements:
 * - Authentication & authorization
 * - Rate limiting
 * - Tenant isolation
 * - Input validation
 * - Error handling
 */

import { NextResponse, NextRequest } from 'next/server';
import { ContentService } from '@/lib/services/cms/ContentService';
import { createCmsContentSchema } from '@/lib/utils/validation';
import { db } from '@/lib/db';
import { properties } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';

const contentService = new ContentService();

export async function GET(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      const { searchParams } = new URL(req.url);
      const propertyId = searchParams.get('propertyId');
      const contentType = searchParams.get('contentType');

      if (!propertyId || !user.tenantId) {
        return errorResponse('Missing propertyId parameter', 400);
      }

      const [propertyCheck] = await db
        .select({ id: properties.id })
        .from(properties)
        .where(and(eq(properties.id, propertyId), eq(properties.tenantId, user.tenantId)))
        .limit(1);

      if (!propertyCheck) {
        return errorResponse('Property not found or does not belong to tenant', 404);
      }

      const content = await contentService.getContentByProperty(propertyId, user.tenantId);
      
      // Filter by content type if provided
      const filteredContent = contentType
        ? content.filter(c => c.contentType === contentType)
        : content;

      return successResponse(filteredContent);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

export async function POST(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      const body = await request.json();
      const validation = createCmsContentSchema.safeParse(body);

      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const { propertyId, contentType, title, content, metadata, status } = validation.data;

      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401);
      }

      const [propertyCheck] = await db
        .select({ id: properties.id })
        .from(properties)
        .where(and(eq(properties.id, propertyId), eq(properties.tenantId, user.tenantId!)))
        .limit(1);

      if (!propertyCheck) {
        return errorResponse('Property not found or does not belong to tenant', 404);
      }

      const newContent = await contentService.createContent(user.tenantId, {
        propertyId,
        contentType,
        title,
        content,
        metadata,
        status,
      });

      return successResponse(newContent, 201);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}
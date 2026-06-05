/**
 * Single-property API
 * Location: app/api/properties/[id]/route.ts
 *
 * GET: property by id (tenant-scoped)
 * PUT: update (owner must match)
 * DELETE: soft-delete (status inactive)
 */

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { PropertyService } from '@/lib/services/property/PropertyService';
import * as z from 'zod';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger.client';

const propertySchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  address: z.string().min(5),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(
    request,
    async (_req, user) => {
      const { id: propertyId } = await params;
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'VALIDATION_ERROR');
      }
      const propertyService = new PropertyService();
      const property = await propertyService.getPropertyById(propertyId, user.tenantId);
      if (!property) {
        return errorResponse('Property not found', 404, 'NOT_FOUND');
      }
      return successResponse(property);
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id: propertyId } = await params;

    const propertyService = new PropertyService();
    if (!user.tenantId) {
      return errorResponse('Tenant ID is required', 400, 'VALIDATION_ERROR');
    }
    const property = await propertyService.getPropertyById(propertyId, user.tenantId);
    if (!property || !user.id || property.ownerId !== user.id) {
      return errorResponse('Forbidden', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const validation = propertySchema.safeParse(body);

    if (!validation.success) {
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.flatten().fieldErrors);
    }

    const { name, description, address } = validation.data;

    const updatedProperty = await propertyService.updateProperty(propertyId, user.tenantId, {
      name,
      description,
      address,
    });

    return successResponse(updatedProperty, 200);
  } catch (error) {
    securityLogger.error('Update property error:', error);
    if (typeof error === 'object' && error !== null && 'statusCode' in error && 'message' in error) {
      return errorResponse(
        (error as AppError).message,
        (error as AppError).statusCode,
        'APP_ERROR'
      );
    }
    return errorResponse('An unexpected error occurred.', 500, 'INTERNAL_ERROR');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(
    request,
    async (_req, user) => {
      const { id: propertyId } = await params;
      if (!user.tenantId || !user.id) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const propertyService = new PropertyService();
      const property = await propertyService.getPropertyById(propertyId, user.tenantId);
      if (!property) {
        return errorResponse('Property not found', 404, 'NOT_FOUND');
      }
      if (property.ownerId !== user.id) {
        return errorResponse('Forbidden', 403, 'FORBIDDEN');
      }

      const archived = await propertyService.archiveProperty(propertyId, user.tenantId);
      return successResponse(
        { id: archived.id, status: archived.status, message: 'Property archived' },
        200
      );
    },
    { requireRole: ['owner', 'admin'], rateLimit: true }
  );
}

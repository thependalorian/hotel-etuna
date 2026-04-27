/**
 * Properties API Route
 * 
 * Purpose: Manage properties with system design principles
 * Location: /app/api/properties/route.ts
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
import { PropertyService } from '@/lib/services/property/PropertyService';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import * as z from 'zod';

const propertySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255, 'Name must be less than 255 characters'),
  type: z.enum(['hotel', 'restaurant', 'both', 'airbnb', 'lodge']),
  description: z.union([z.string(), z.literal('')]).optional().transform(val => val === '' ? undefined : val),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500, 'Address must be less than 500 characters'),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('Namibia'),
  postal_code: z.string().optional(),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      const propertyService = new PropertyService();
      const properties = await propertyService.getPropertiesByTenant(user.tenantId!);
      
      return successResponse(properties);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

export async function POST(request: NextRequest) {
  console.log('[POST /api/properties] Request received');
  return withApiAuth(
    request,
    async (req, user) => {
      console.log('[POST /api/properties] Inside handler, user:', user?.email);
      let body;
      try {
        body = await request.json();
        console.log('[POST /api/properties] Request body parsed:', JSON.stringify(body, null, 2));
      } catch (error) {
        console.error('[POST /api/properties] JSON parse error:', error);
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = propertySchema.safeParse(body);

      if (!validation.success) {
        const fieldErrors = validation.error.flatten().fieldErrors;
        console.error('Property validation failed:', {
          received: body,
          errors: fieldErrors,
          issues: validation.error.issues,
        });
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          fieldErrors
        );
      }

      const { name, type, description, address, images, amenities } = validation.data;
      
      // Store the DB enum/check value consistently while still accepting API enum input.
      const dbType = type.toLowerCase() as 'hotel' | 'restaurant' | 'airbnb' | 'lodge' | 'both';
      
      console.log('[POST /api/properties] Calling PropertyService.createProperty with:', {
        name,
        type: dbType,
        ownerId: user.id,
        tenantId: user.tenantId,
        imagesCount: images?.length || 0,
        amenitiesCount: amenities?.length || 0,
      });
      
      const propertyService = new PropertyService();
      let newProperty;
      try {
        newProperty = await propertyService.createProperty({
          name,
          type: dbType,
          description,
          address,
          ownerId: user.id!,
          tenantId: user.tenantId!,
          images, // Pass images array if provided
          amenities, // Pass amenities array if provided
        });

        console.log('[POST /api/properties] Property created successfully:', newProperty.id);
        return successResponse(newProperty, 201);
      } catch (error: any) {
        console.error('[POST /api/properties] PropertyService error:', {
          message: error.message,
          code: error.code,
          meta: error.meta,
          stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        });
        
        // Return more specific error messages for Prisma errors
        if (error.code === '23502') {
          return errorResponse(
            `Database constraint violation: Missing required field${error.meta?.column ? ` (column: ${error.meta.column})` : ''}`,
            400,
            'DATABASE_CONSTRAINT_ERROR',
            { code: error.code, column: error.meta?.column, constraint: error.meta?.constraint }
          );
        }
        
        if (error.code === '23505') {
          // Extract slug from error constraint or use name as fallback
          const slugValue = error.meta?.constraint?.split('_').pop() || validation.data.name || 'unknown';
          return errorResponse(
            'Property with this slug already exists',
            409,
            'DUPLICATE_SLUG',
            { slug: slugValue, code: error.code, constraint: error.meta?.constraint }
          );
        }
        
        // Generic error for other database issues - include error details
        return errorResponse(
          error.message || 'Failed to create property',
          500,
          'PROPERTY_CREATION_ERROR',
          { 
            code: error.code || 'UNKNOWN_ERROR',
            meta: error.meta,
            message: error.message
          }
        );
      }
    },
    {
      requireRole: ['owner', 'admin'],
      rateLimit: true,
    }
  );
}

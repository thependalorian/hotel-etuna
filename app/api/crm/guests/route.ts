/**
 * CRM Guests API Route
 * 
 * Purpose: Manage guest/CRM operations with system design principles
 * Location: /app/api/crm/guests/route.ts
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
import { GuestService } from '@/lib/services/booking/GuestService';
import { guestSchema } from '@/lib/utils/validation';
import * as z from 'zod';

const guestService = new GuestService();

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      const guests = await guestService.getGuestsByTenant(user.tenantId);
      return successResponse(guests);
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

      const validation = guestSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const newGuest = await guestService.createGuest(user.tenantId, validation.data);
      return successResponse(newGuest, 201);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}
/**
 * Housekeeping Tasks API Route
 * 
 * Purpose: Manage housekeeping tasks with system design principles
 * Location: /app/api/housekeeping/tasks/route.ts
 * 
 * Implements:
 * - Authentication & authorization
 * - Tenant isolation
 * - Input validation
 * - Error handling
 * 
 * Following System Design Principles:
 * - API Design Best Practices
 * - Security Architecture
 * - Multi-Tenancy Strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { HousekeepingService } from '@/lib/services/housekeeping/HousekeepingService';
import { entityId } from '@/lib/validation/entity-ids';
import * as z from 'zod';

const createTaskSchema = z.object({
  propertyId: entityId('Invalid property ID'),
  roomId: entityId('Invalid room ID'),
  bookingId: entityId('Invalid booking ID').optional(),
  taskType: z.enum(['checkout_clean', 'stayover', 'deep_clean', 'maintenance']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
  assignedTo: entityId('Invalid user ID').optional(),
});

const listTasksQuerySchema = z.object({
  status: z.string().optional(),
  assignedTo: entityId('Invalid user ID').optional(),
  roomId: entityId('Invalid room ID').optional(),
  propertyId: entityId('Invalid property ID').optional(),
  taskType: z.enum(['checkout_clean', 'stayover', 'deep_clean', 'maintenance']).optional(),
});

/**
 * GET /api/housekeeping/tasks
 * List housekeeping tasks with optional filters
 */
export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const parsed = listTasksQuerySchema.safeParse({
        status: req.nextUrl.searchParams.get('status') ?? undefined,
        assignedTo: req.nextUrl.searchParams.get('assignedTo') ?? undefined,
        roomId: req.nextUrl.searchParams.get('roomId') ?? undefined,
        propertyId: req.nextUrl.searchParams.get('propertyId') ?? undefined,
        taskType: req.nextUrl.searchParams.get('taskType') ?? undefined,
      });

      if (!parsed.success) {
        return errorResponse(
          'Invalid query parameters',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }

      const housekeepingService = new HousekeepingService();
      const tasks = await housekeepingService.getTasks(user.tenantId, parsed.data);

      return successResponse({ tasks }, 200);
    },
    { requireAuth: true }
  );
}

/**
 * POST /api/housekeeping/tasks
 * Create a new housekeeping task
 */
export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const body = await req.json();
      const parsed = createTaskSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(
          'Invalid request body',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }

      const housekeepingService = new HousekeepingService();
      const task = await housekeepingService.createTask({
        tenantId: user.tenantId,
        ...parsed.data,
      });

      return successResponse({ task }, 201);
    },
    { requireAuth: true }
  );
}

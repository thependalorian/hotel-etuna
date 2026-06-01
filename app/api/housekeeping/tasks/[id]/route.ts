/**
 * Housekeeping Task Update API Route
 * 
 * Purpose: Update individual housekeeping task (status, assignment)
 * Location: /app/api/housekeeping/tasks/[id]/route.ts
 * 
 * Implements:
 * - Authentication & authorization
 * - Tenant isolation
 * - Input validation
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { HousekeepingService } from '@/lib/services/housekeeping/HousekeepingService';
import { entityId } from '@/lib/validation/entity-ids';
import * as z from 'zod';

const updateTaskSchema = z.object({
  status: z.enum(['dirty', 'cleaning', 'inspecting', 'clean', 'cancelled']).optional(),
  assignedTo: entityId('Invalid user ID').optional(),
});

/**
 * PATCH /api/housekeeping/tasks/[id]
 * Update task status or assignment
 */
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

      const taskId = params.id;
      if (!taskId) {
        return errorResponse('Task ID is required', 400, 'MISSING_TASK_ID');
      }

      const body = await req.json();
      const parsed = updateTaskSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(
          'Invalid request body',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }

      const housekeepingService = new HousekeepingService();
      
      // Update status if provided
      if (parsed.data.status) {
        const task = await housekeepingService.updateTaskStatus(
          taskId,
          parsed.data.status,
          user.tenantId
        );
        return successResponse({ task }, 200);
      }

      // Update assignment if provided
      if (parsed.data.assignedTo) {
        await housekeepingService.assignTask(taskId, parsed.data.assignedTo, user.tenantId);
        const task = await housekeepingService.getTask(taskId, user.tenantId);
        return successResponse({ task }, 200);
      }

      return errorResponse('No updates provided', 400, 'NO_UPDATES');
    },
    { requireAuth: true }
  );
}

/**
 * Housekeeping Task Photos API Route
 * 
 * Purpose: Upload photos for housekeeping tasks
 * Location: /app/api/housekeeping/tasks/[id]/photos/route.ts
 * 
 * Implements:
 * - Authentication & authorization
 * - Tenant isolation
 * - Input validation
 * - Photo limit enforcement (max 5 per task)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { HousekeepingService } from '@/lib/services/housekeeping/HousekeepingService';
import * as z from 'zod';

const addPhotoSchema = z.object({
  photoUrl: z.string().url('Invalid photo URL'),
  caption: z.string().optional(),
});

/**
 * POST /api/housekeeping/tasks/[id]/photos
 * Upload a photo for a task (max 5 photos per task)
 */
export async function POST(
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
      const parsed = addPhotoSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(
          'Invalid request body',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }

      const housekeepingService = new HousekeepingService();
      const photo = await housekeepingService.addPhoto({
        tenantId: user.tenantId,
        taskId,
        photoUrl: parsed.data.photoUrl,
        caption: parsed.data.caption,
        uploadedBy: user.id,
      });

      return successResponse({ photo }, 201);
    },
    { requireAuth: true }
  );
}

/**
 * GET /api/housekeeping/tasks/[id]/photos
 * Get all photos for a task
 */
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

      const taskId = params.id;
      if (!taskId) {
        return errorResponse('Task ID is required', 400, 'MISSING_TASK_ID');
      }

      const housekeepingService = new HousekeepingService();
      const photos = await housekeepingService.getTaskPhotos(taskId, user.tenantId);

      return successResponse({ photos }, 200);
    },
    { requireAuth: true }
  );
}

import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { RoomService } from '@/lib/services/room/RoomService';
import { PropertyService } from '@/lib/services/property/PropertyService';
import * as z from 'zod';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';

const roomSchema = z.object({
  room_number: z.string().min(1),
  room_type: z.string().min(3),
  max_occupancy: z.number().min(1),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      try {
        const { id: propertyId } = await params;

        const propertyService = new PropertyService();
        if (!user.tenantId) {
          return errorResponse('Tenant ID is required', 400, 'VALIDATION_ERROR');
        }
        const property = await propertyService.getPropertyById(propertyId, user.tenantId);
        if (!property || !user.id || property.ownerId !== user.id) {
          return errorResponse('Forbidden', 403, 'FORBIDDEN');
        }

        const body = await req.json();
        const validation = roomSchema.safeParse(body);

        if (!validation.success) {
          return errorResponse(
            'Invalid input.',
            400,
            'VALIDATION_ERROR',
            validation.error.flatten().fieldErrors
          );
        }

        const { room_number, room_type, max_occupancy } = validation.data;

        const roomService = new RoomService();
        const newRoom = await roomService.createRoom({
          roomNumber: room_number,
          roomType: room_type,
          maxOccupancy: max_occupancy,
          propertyId,
        });

        return successResponse(newRoom, 201);
      } catch (error) {
        securityLogger.error('Create room error:', error);
        if (typeof error === 'object' && error !== null && 'statusCode' in error && 'message' in error) {
          return errorResponse(error.message as string, (error as AppError).statusCode, 'APP_ERROR');
        }
        return errorResponse('An unexpected error occurred.', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

/**
 * Rooms API Route
 * 
 * Purpose: Manage rooms with system design principles
 * Location: /app/api/rooms/route.ts
 * 
 * Implements:
 * - Authentication & authorization
 * - Rate limiting
 * - Tenant isolation
 * - Input validation
 * - Error handling
 * - Query parameter filtering
 * 
 * Following System Design Principles:
 * - API Design Best Practices
 * - Security Architecture
 * - Multi-Tenancy Strategy
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { RoomService } from '@/lib/services/room/RoomService';
import { entityIdOptional } from '@/lib/validation/entity-ids';
import * as z from 'zod';
import { securityLogger } from '@/lib/utils/security-logger.client';

const roomService = new RoomService();

const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  room_number: z.string().optional(),
  type: z.string().optional(),
  room_type: z.string().optional(),
  propertyId: entityIdOptional(),
  property_id: entityIdOptional(),
  capacity: z.number().min(1).optional(),
  max_occupancy: z.number().min(1).optional(),
  price: z.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.id || !user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      let body;
      try {
        body = await request.json();
      } catch (error) {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = createRoomSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      try {
        const propertyId = validation.data.propertyId || (validation.data as any).property_id;
        if (!propertyId) {
          return errorResponse('Property ID is required', 400, 'MISSING_PROPERTY_ID');
        }
        // Map schema fields to DTO fields
        const roomData = {
          roomNumber: validation.data.room_number || validation.data.name,
          roomType: validation.data.room_type || validation.data.type || 'Standard',
          maxOccupancy: validation.data.max_occupancy || validation.data.capacity || 2,
          propertyId,
        };
        const newRoom = await roomService.createRoom(roomData);
        return successResponse(newRoom, 201);
      } catch (error: any) {
        securityLogger.error('Error creating room:', error);
        return errorResponse(
          error.message || 'Internal server error',
          500,
          'INTERNAL_ERROR'
        );
      }
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get('propertyId');
        const query = searchParams.get('query') || '';
        const type = searchParams.get('type') || undefined;
        const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
        const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
        const capacity = searchParams.get('capacity') ? parseInt(searchParams.get('capacity')!) : undefined;
        const amenities = searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : undefined;

        if (propertyId) {
          // Get rooms by property
          const rooms = await roomService.getRoomsByProperty(propertyId, user.tenantId);
          return successResponse(rooms);
        } else if (query || type || minPrice || maxPrice || capacity || amenities) {
          // Search rooms with filters
          const filters = {
            type,
            minPrice,
            maxPrice,
            capacity,
            amenities,
          };
          const rooms = await roomService.searchRooms(user.tenantId, query, filters);
          return successResponse(rooms);
        } else {
          // Get room stats
          const stats = await roomService.getRoomStats(user.tenantId);
          return successResponse(stats);
        }
      } catch (error: any) {
        securityLogger.error('Error fetching rooms:', error);
        return errorResponse(
          error.message || 'Internal server error',
          500,
          'INTERNAL_ERROR'
        );
      }
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

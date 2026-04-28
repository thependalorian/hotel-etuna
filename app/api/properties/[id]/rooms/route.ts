import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';
import { RoomService } from '@/lib/services/room/RoomService';
import { PropertyService } from '@/lib/services/property/PropertyService';
import * as z from 'zod';
import { AppError } from '@/lib/utils/errors';

const roomSchema = z.object({
  room_number: z.string().min(1),
  room_type: z.string().min(3),
  max_occupancy: z.number().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId } = await params;
    
    // Authorize: Check if the user owns this property
    const propertyService = new PropertyService();
    if (!user.tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }
    const property = await propertyService.getPropertyById(propertyId, user.tenantId);
    if (!property || !user.id || property.ownerId !== user.id) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = roomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { room_number, room_type, max_occupancy } = validation.data;
    
    const roomService = new RoomService();
    const newRoom = await roomService.createRoom({
      roomNumber: room_number,
      roomType: room_type,
      maxOccupancy: max_occupancy,
      propertyId,
    });

    return NextResponse.json(newRoom, { status: 201 });

  } catch (error) {
    console.error('Create room error:', error);
    if (typeof error === 'object' && error !== null && 'statusCode' in error && 'message' in error) {
        return NextResponse.json({ message: error.message }, { status: (error as AppError).statusCode });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
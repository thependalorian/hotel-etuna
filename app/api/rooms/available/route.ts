import { NextResponse, NextRequest } from 'next/server';
import { BookingService } from '@/lib/services/booking/BookingService';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';

const bookingService = new BookingService();

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || !user.tenantId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');

    if (!propertyId || !checkIn || !checkOut) {
      return NextResponse.json(
        { message: 'Missing required parameters: propertyId, checkIn, checkOut' },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { message: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }

    const availableRooms = await bookingService.getAvailableRooms(
      propertyId,
      checkInDate,
      checkOutDate
    );

    return NextResponse.json(availableRooms, { status: 200 });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

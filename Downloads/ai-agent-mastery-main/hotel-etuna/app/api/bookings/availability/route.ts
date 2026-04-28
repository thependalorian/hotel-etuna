import { NextResponse, NextRequest } from 'next/server';
import { BookingService } from '@/lib/services/booking/BookingService';
import { AppError } from '@/lib/utils/errors';

const bookingService = new BookingService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');

    if (!propertyId || !checkInDate || !checkOutDate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const availableRooms = await bookingService.getAvailableRooms(
      propertyId,
      new Date(checkInDate),
      new Date(checkOutDate)
    );

    return NextResponse.json(availableRooms, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const propertyId = body?.propertyId as string | undefined;
    const checkInDate = body?.checkInDate as string | undefined;
    const checkOutDate = body?.checkOutDate as string | undefined;

    if (!propertyId || !checkInDate || !checkOutDate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const availableRooms = await bookingService.getAvailableRooms(
      propertyId,
      new Date(checkInDate),
      new Date(checkOutDate)
    );

    return NextResponse.json(availableRooms, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
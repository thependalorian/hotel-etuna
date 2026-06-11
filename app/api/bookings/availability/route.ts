/**
 * @fileoverview Room availability API (public, optional-auth).
 *
 * GET/POST /api/bookings/availability — returns available rooms for a property
 * and date range. Anonymous callers receive rate-stripped rows (gated pricing);
 * authenticated callers (Stack Auth or NextAuth, via the shared dual-auth
 * cascade in lib/utils/api-helpers) receive full rates.
 */
import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';
import { BookingService } from '@/lib/services/booking/BookingService';
import { stripRatesFromAvailabilityRow } from '@/lib/rooms/public-rate';
import { AppError } from '@/lib/utils/errors';

const bookingService = new BookingService();

/**
 * Shape the availability payload based on auth state.
 * Anonymous users get rate-stripped rows; authenticated users get full rates.
 */
async function respondWithAvailability(
  request: NextRequest,
  availableRooms: Awaited<ReturnType<BookingService['getAvailableRooms']>>,
) {
  // Dual-auth cascade (Stack Auth → NextAuth) so both auth systems unlock rates.
  const user = await getAuthenticatedUser(request);
  const isAuthenticated = Boolean(user);
  const payload = isAuthenticated
    ? availableRooms
    : availableRooms.map((room) => stripRatesFromAvailabilityRow(room));

  return NextResponse.json(payload, { status: 200 });
}

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

    return respondWithAvailability(request, availableRooms);
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

    return respondWithAvailability(request, availableRooms);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { BookingService } from '@/lib/services/booking/BookingService';
import { securityLogger } from '@/lib/utils/security-logger';

const bookingService = new BookingService();

export async function GET(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const checkIn = searchParams.get('checkIn');
        const checkOut = searchParams.get('checkOut');

        if (!propertyId || !checkIn || !checkOut) {
          return errorResponse(
            'Missing required parameters: propertyId, checkIn, checkOut',
            400,
            'VALIDATION_ERROR'
          );
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkInDate >= checkOutDate) {
          return errorResponse('Check-out date must be after check-in date', 400, 'VALIDATION_ERROR');
        }

        const availableRooms = await bookingService.getAvailableRooms(
          propertyId,
          checkInDate,
          checkOutDate
        );

        return successResponse(availableRooms);
      } catch (error) {
        securityLogger.error('Error fetching available rooms:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

/**
 * Public room QR resolver
 *
 * Purpose: Map in-room QR to the active checked-in booking for room service.
 * Location: /app/api/public/room-qr/[code]/route.ts
 *
 * GET response: { data: { bookingId, roomNumber, propertyId, guestName } }
 */

import { NextRequest } from 'next/server';
import { FolioService } from '@/lib/services/folio/FolioService';
import { errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger.client';

const folioService = new FolioService();

type RouteParams = { params: Promise<{ code: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    if (!code?.trim()) {
      return errorResponse('QR code is required', 400, 'VALIDATION_ERROR');
    }

    const stay = await folioService.resolveActiveBookingForRoomQr(code.trim());
    const guestName = [stay.guestFirstName, stay.guestLastName].filter(Boolean).join(' ');

    return successResponse({
      bookingId: stay.bookingId,
      roomNumber: stay.roomNumber,
      propertyId: stay.propertyId,
      guestName: guestName || null,
      orderApiPath: `/api/guest/stays/${stay.bookingId}/orders`,
      folioApiPath: `/api/guest/stays/${stay.bookingId}/folio`,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, 'ROOM_QR_ERROR');
    }
    securityLogger.error('[GET /api/public/room-qr/[code]]', error);
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

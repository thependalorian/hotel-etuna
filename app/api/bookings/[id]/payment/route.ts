/**
 * Cash Payment API Endpoint
 *
 * Purpose: Mark cash bookings as paid with amount tracking
 * Location: app/api/bookings/[id]/payment/route.ts
 *
 * Features:
 * - PATCH: Mark cash payment as received
 * - Tracks amount tendered and change given
 * - Generates unique receipt number
 * - Updates booking status to confirmed
 * - Requires staff authentication
 *
 * @version 1.0.0
 * @since April 28, 2026
 */

import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { db } from '@/lib/db';
import { auditTrail, bookings, transactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { FolioService } from '@/lib/services/folio/FolioService';
import { schedulePaymentReceiptEmail } from '@/lib/services/booking/bookingLifecycleSideEffects';
import { securityLogger } from '@/lib/utils/security-logger';

const STAFF_ROLES = ['admin', 'staff', 'manager'] as const;

const markAsPaidSchema = z.object({
  amountTendered: z.number().positive('Amount tendered must be positive'),
  changeGiven: z.number().min(0, 'Change cannot be negative'),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/bookings/[id]/payment
 * Mark a cash booking as paid
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      try {
        const { id } = await params;

        const body = await req.json();
        const validation = markAsPaidSchema.safeParse(body);

        if (!validation.success) {
          return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', validation.error.issues);
        }

        const { amountTendered, changeGiven, notes } = validation.data;

        const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);

        if (!booking) {
          return errorResponse('Booking not found', 404, 'NOT_FOUND');
        }

        if (!user.tenantId || booking.tenantId !== user.tenantId) {
          return errorResponse('Forbidden', 403, 'FORBIDDEN');
        }

        if (booking.paymentMethod !== 'cash') {
          return errorResponse(
            `This endpoint is only for cash payments. Payment method is: ${booking.paymentMethod}`,
            400,
            'INVALID_OPERATION'
          );
        }

        if (booking.paymentStatus === 'paid') {
          return errorResponse('This booking has already been marked as paid', 400, 'ALREADY_PAID', {
            receiptNumber: booking.receiptNumber,
          });
        }

        const totalAmount = parseFloat(booking.totalAmount);
        if (amountTendered < totalAmount) {
          return errorResponse(
            `Amount tendered (${amountTendered}) is less than total amount (${totalAmount})`,
            400,
            'INSUFFICIENT_PAYMENT'
          );
        }

        const expectedChange = amountTendered - totalAmount;
        const changeDifference = Math.abs(changeGiven - expectedChange);

        if (changeDifference > 0.01) {
          return errorResponse(
            `Change given (${changeGiven}) does not match expected change (${expectedChange.toFixed(2)})`,
            400,
            'CHANGE_MISMATCH'
          );
        }

        const receiptNumber = generateReceiptNumber(
          booking.propertyId ?? 'XX',
          booking.bookingReference
        );

        await db
          .update(bookings)
          .set({
            paymentStatus: 'paid',
            amountTendered: amountTendered.toString(),
            changeGiven: changeGiven.toString(),
            receiptNumber,
            status: 'confirmed',
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, id));

        const [updatedBooking] = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, id))
          .limit(1);

        if (!updatedBooking) {
          return errorResponse('Booking update failed', 500, 'INTERNAL_ERROR');
        }

        const folioService = new FolioService();
        await folioService.ensureRoomChargeForBooking(updatedBooking);

        const [transaction] = await db
          .insert(transactions)
          .values({
            tenantId: booking.tenantId,
            bookingId: id,
            guestId: updatedBooking.guestId,
            transactionReference: `CASH-${receiptNumber}`,
            type: 'booking_payment',
            amount: updatedBooking.totalAmount,
            currency: updatedBooking.currency ?? 'NAD',
            status: 'completed',
            paymentGateway: 'cash',
            gatewayTransactionId: receiptNumber,
            description: `Cash payment for booking ${updatedBooking.bookingReference}`,
            metadata: {
              amountTendered,
              changeGiven,
              receiptNumber,
              notes: notes ?? null,
              markedByUserId: user.id,
            },
            processedAt: new Date(),
          })
          .returning({ id: transactions.id });

        if (updatedBooking.guestId) {
          const paidTotal = Number.parseFloat(String(updatedBooking.totalAmount ?? amountTendered));
          schedulePaymentReceiptEmail({
            tenantId: booking.tenantId,
            bookingId: id,
            guestId: updatedBooking.guestId,
            propertyId: updatedBooking.propertyId,
            amount: Number.isFinite(paidTotal) ? paidTotal : amountTendered,
            currency: updatedBooking.currency ?? 'NAD',
            paymentMethod: 'cash',
            bookingReference: updatedBooking.bookingReference ?? undefined,
            transactionId: transaction?.id,
          });
        }

        await db.insert(auditTrail).values({
          tenantId: booking.tenantId,
          userId: user.id,
          action: 'cash_payment_marked_paid',
          resourceType: 'booking',
          resourceId: booking.id,
          oldValues: {
            paymentStatus: booking.paymentStatus,
            paymentMethod: booking.paymentMethod,
            amountTendered: booking.amountTendered,
            changeGiven: booking.changeGiven,
            receiptNumber: booking.receiptNumber,
          },
          newValues: {
            paymentStatus: 'paid',
            paymentMethod: booking.paymentMethod,
            amountTendered,
            changeGiven,
            receiptNumber,
            notes: notes ?? null,
            transactionId: transaction?.id ?? null,
          },
          ipAddress: req.headers.get('x-forwarded-for') ?? null,
          userAgent: req.headers.get('user-agent') ?? null,
        });

        return successResponse({
          message: 'Payment marked as received',
          booking: {
            id: updatedBooking.id,
            bookingReference: updatedBooking.bookingReference,
            status: updatedBooking.status,
            paymentStatus: updatedBooking.paymentStatus,
            paymentMethod: updatedBooking.paymentMethod,
            totalAmount: updatedBooking.totalAmount,
            amountTendered: updatedBooking.amountTendered,
            changeGiven: updatedBooking.changeGiven,
            receiptNumber: updatedBooking.receiptNumber,
          },
          transactionId: transaction?.id ?? null,
        });
      } catch (error) {
        securityLogger.error('[MARK PAYMENT AS PAID ERROR]', error);
        return errorResponse(
          error instanceof Error ? error.message : 'Unknown error',
          500,
          'INTERNAL_ERROR'
        );
      }
    },
    { rateLimit: true, requireRole: [...STAFF_ROLES] }
  );
}

/**
 * GET /api/bookings/[id]/payment
 * Retrieve payment details for a booking
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withPlatformApiAuth(
    request,
    async (_req, _user) => {
      try {
        const { id } = await params;

        const [booking] = await db
          .select({
            id: bookings.id,
            bookingReference: bookings.bookingReference,
            status: bookings.status,
            paymentStatus: bookings.paymentStatus,
            paymentMethod: bookings.paymentMethod,
            totalAmount: bookings.totalAmount,
            amountTendered: bookings.amountTendered,
            changeGiven: bookings.changeGiven,
            receiptNumber: bookings.receiptNumber,
            currency: bookings.currency,
            createdAt: bookings.createdAt,
            updatedAt: bookings.updatedAt,
          })
          .from(bookings)
          .where(eq(bookings.id, id))
          .limit(1);

        if (!booking) {
          return errorResponse('Booking not found', 404, 'NOT_FOUND');
        }

        return successResponse({ payment: booking });
      } catch (error) {
        securityLogger.error('[GET PAYMENT DETAILS ERROR]', error);
        return errorResponse(
          error instanceof Error ? error.message : 'Unknown error',
          500,
          'INTERNAL_ERROR'
        );
      }
    },
    { rateLimit: true, requireRole: [...STAFF_ROLES] }
  );
}

function generateReceiptNumber(propertyId: string, bookingReference: string): string {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const propertyAbbr = propertyId.substring(0, 2).toUpperCase() || 'XX';
  const cleanRef = bookingReference.replace(/[^A-Z0-9]/gi, '').substring(0, 10);

  return `RCPT-${propertyAbbr}-${cleanRef}-${timestamp}-${random}`;
}

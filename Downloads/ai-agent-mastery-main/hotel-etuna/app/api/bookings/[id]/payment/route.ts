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

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const markAsPaidSchema = z.object({
  amountTendered: z.number().positive('Amount tendered must be positive'),
  changeGiven: z.number().min(0, 'Change cannot be negative'),
  notes: z.string().optional(),
});

/**
 * PATCH /api/bookings/[id]/payment
 * Mark a cash booking as paid
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Authentication check (staff only)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Staff authorization check
    const userRole = session.user.role;
    if (!['admin', 'staff', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Only staff can mark payments as paid' },
        { status: 403 }
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const validation = markAsPaidSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { amountTendered, changeGiven, notes } = validation.data;

    // 4. Fetch booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // 5. Verify booking is for cash payment
    if (booking.paymentMethod !== 'cash') {
      return NextResponse.json(
        { 
          error: 'Invalid operation', 
          message: 'This endpoint is only for cash payments. Payment method is: ' + booking.paymentMethod 
        },
        { status: 400 }
      );
    }

    // 6. Verify booking is not already marked as paid
    if (booking.paymentStatus === 'paid') {
      return NextResponse.json(
        { 
          error: 'Already paid', 
          message: 'This booking has already been marked as paid',
          receiptNumber: booking.receiptNumber
        },
        { status: 400 }
      );
    }

    // 7. Validate amounts
    const totalAmount = parseFloat(booking.totalAmount);
    if (amountTendered < totalAmount) {
      return NextResponse.json(
        { 
          error: 'Insufficient payment', 
          message: `Amount tendered (${amountTendered}) is less than total amount (${totalAmount})` 
        },
        { status: 400 }
      );
    }

    const expectedChange = amountTendered - totalAmount;
    const changeDifference = Math.abs(changeGiven - expectedChange);
    
    // Allow up to 0.01 difference for floating point precision
    if (changeDifference > 0.01) {
      return NextResponse.json(
        { 
          error: 'Change mismatch', 
          message: `Change given (${changeGiven}) does not match expected change (${expectedChange.toFixed(2)})` 
        },
        { status: 400 }
      );
    }

    // 8. Generate unique receipt number
    const receiptNumber = generateReceiptNumber(booking.propertyId, booking.bookingReference);

    // 9. Update booking
    await db
      .update(bookings)
      .set({
        paymentStatus: 'paid',
        amountTendered: amountTendered.toString(),
        changeGiven: changeGiven.toString(),
        receiptNumber,
        status: 'confirmed', // Move from pending_payment to confirmed
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, id));

    // 10. Fetch updated booking
    const [updatedBooking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    // 11. Log audit trail (TODO: Add to audit log table)
    console.log('[CASH PAYMENT RECEIVED]', {
      bookingId: id,
      bookingReference: booking.bookingReference,
      totalAmount,
      amountTendered,
      changeGiven,
      receiptNumber,
      staffId: session.user.id,
      staffEmail: session.user.email,
      timestamp: new Date().toISOString(),
      notes,
    });

    return NextResponse.json({
      success: true,
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
    });

  } catch (error) {
    console.error('[MARK PAYMENT AS PAID ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/[id]/payment
 * Retrieve payment details for a booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Fetch booking
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
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: booking,
    });

  } catch (error) {
    console.error('[GET PAYMENT DETAILS ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Generate unique receipt number
 * Format: RCPT-{PROPERTY_ABBR}-{BOOKING_REF}-{TIMESTAMP}
 * Example: RCPT-HE-BK001-20260428
 */
function generateReceiptNumber(propertyId: string, bookingReference: string): string {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  // Extract property abbreviation (first 2 chars or 'XX')
  const propertyAbbr = propertyId.substring(0, 2).toUpperCase() || 'XX';
  
  // Clean booking reference (remove spaces/special chars)
  const cleanRef = bookingReference.replace(/[^A-Z0-9]/gi, '').substring(0, 10);
  
  return `RCPT-${propertyAbbr}-${cleanRef}-${timestamp}-${random}`;
}

/**
 * Payment Completion Endpoint
 * 
 * Purpose: Complete payment after 3DS authentication
 * Location: app/api/payments/complete/route.ts
 * 
 * Flow:
 * 1. Receive transaction ID and status from 3DS callback
 * 2. Authorise payment with Adumo
 * 3. Settle payment (or schedule for later settlement)
 * 4. Update booking status
 * 5. Send confirmation email
 * 
 * Compliance:
 * - PSD-4: Complete 3DS flow
 * - PSD-12: Security audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdumoEnterpriseService } from '@/lib/services/payment/AdumoEnterpriseService';
import { sql } from '@/lib/db/connection';
import { BookingPaymentStatus, HTTP_STATUS } from '@/lib/config/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get('transactionId');
  const status = searchParams.get('status');
  const reason = searchParams.get('reason');

  console.log('[Payment Complete] Received completion request', {
    transactionId,
    status,
    reason,
  });

  if (!transactionId) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing transaction ID',
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  try {
    // Get booking associated with transaction
    const booking = await sql`
      SELECT b.*, t.tenant_id
      FROM bookings b
      LEFT JOIN properties p ON b.property_id = p.id
      LEFT JOIN tenants t ON p.tenant_id = t.id
      WHERE b.payment_transaction_id = ${transactionId}
      LIMIT 1
    `;

    if (booking.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found for transaction',
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    const bookingData = booking[0];

    // Handle different statuses
    if (status === 'authenticated') {
      // 3DS authentication successful - proceed to authorise and settle
      try {
        // Authorise payment
        const authoriseResult = await AdumoEnterpriseService.performAction(
          'authorise',
          transactionId,
          Number(bookingData.total_amount)
        );

        if (authoriseResult.statusCode === HTTP_STATUS.OK) {
          // Settle payment (capture funds)
          const settleResult = await AdumoEnterpriseService.performAction(
            'settle',
            transactionId,
            Number(bookingData.total_amount)
          );

          if (settleResult.statusCode === HTTP_STATUS.OK) {
            // Update booking status to confirmed
            await sql`
              UPDATE bookings
              SET 
                status = 'confirmed',
                payment_status = ${BookingPaymentStatus.PAID},
                payment_method = 'card',
                payment_gateway = 'adumo',
                payment_gateway_transaction_id = ${settleResult.authorisationCode},
                updated_at = NOW()
              WHERE id = ${bookingData.id}
            `;

            console.log('[Payment Complete] Payment successful', {
              bookingId: bookingData.id,
              transactionId,
              amount: bookingData.total_amount,
              authorisationCode: settleResult.authorisationCode,
            });

            // TODO: Send confirmation email
            // await sendBookingConfirmationEmail(bookingData);

            return NextResponse.json({
              success: true,
              message: 'Payment completed successfully',
              booking: {
                id: bookingData.id,
                status: 'confirmed',
                transactionId,
                authorisationCode: settleResult.authorisationCode,
              },
            });
          } else {
            // Settlement failed
            await sql`
              UPDATE bookings
              SET 
                status = 'payment_failed',
                payment_status = ${BookingPaymentStatus.FAILED},
                updated_at = NOW()
              WHERE id = ${bookingData.id}
            `;

            return NextResponse.json(
              {
                success: false,
                error: 'Payment settlement failed',
                details: settleResult.statusMessage,
              },
              { status: HTTP_STATUS.PAYMENT_REQUIRED }
            );
          }
        } else {
          // Authorisation failed
          await sql`
            UPDATE bookings
            SET 
              status = 'payment_failed',
              payment_status = ${BookingPaymentStatus.FAILED},
              updated_at = NOW()
            WHERE id = ${bookingData.id}
          `;

          return NextResponse.json(
            {
              success: false,
              error: 'Payment authorisation failed',
              details: authoriseResult.statusMessage,
            },
            { status: HTTP_STATUS.PAYMENT_REQUIRED }
          );
        }
      } catch (error) {
        console.error('[Payment Complete] Adumo API error:', error);

        await sql`
          UPDATE bookings
          SET 
            status = 'payment_failed',
            payment_status = ${BookingPaymentStatus.FAILED},
            updated_at = NOW()
          WHERE id = ${bookingData.id}
        `;

        return NextResponse.json(
          {
            success: false,
            error: 'Payment processing error',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }
    } else if (status === 'failed') {
      // 3DS authentication failed
      await sql`
        UPDATE bookings
        SET 
          status = 'payment_failed',
          payment_status = ${BookingPaymentStatus.FAILED},
          updated_at = NOW()
        WHERE id = ${bookingData.id}
      `;

      return NextResponse.json(
        {
          success: false,
          error: '3D Secure authentication failed',
          reason,
        },
        { status: HTTP_STATUS.PAYMENT_REQUIRED }
      );
    } else {
      // Unknown status
      return NextResponse.json(
        {
          success: false,
          error: 'Unknown payment status',
          status,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
  } catch (error) {
    console.error('[Payment Complete] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

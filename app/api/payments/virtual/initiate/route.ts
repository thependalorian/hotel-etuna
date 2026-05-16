/**
 * Adumo Virtual — start hosted payment page (form POST fields for browser).
 * Location: app/api/payments/virtual/initiate/route.ts
 *
 * POST body: { bookingId, amount, purpose?: 'booking_deposit' | 'folio_settle', returnSuccessUrl?, returnFailUrl? }
 * Response: { data: { actionUrl, fields } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { bookings, guests, paymentSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { entityId } from '@/lib/validation/entity-ids';
import {
  assertCheckedIn,
  assertStayAccess,
  loadBookingWithGuest,
} from '@/lib/services/folio/guestStayAccess';
import { AdumoVirtualService } from '@/lib/services/payment/AdumoVirtualService';
import { FolioService } from '@/lib/services/folio/FolioService';

const initiateSchema = z.object({
  bookingId: entityId(),
  amount: z.number().positive().optional(),
  purpose: z.enum(['booking_deposit', 'folio_settle']).default('booking_deposit'),
  returnSuccessUrl: z.string().url().optional(),
  returnFailUrl: z.string().url().optional(),
});

const folioService = new FolioService();

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!AdumoVirtualService.isConfigured()) {
        return errorResponse(
          'Adumo Virtual is not configured (ADUMO_MERCHANT_UID, ADUMO_APPLICATION_UID, ADUMO_JWT_SECRET)',
          503,
          'ADUMO_NOT_CONFIGURED'
        );
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }

      const parsed = initiateSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
      }

      const { bookingId, purpose, returnSuccessUrl, returnFailUrl } = parsed.data;
      await assertStayAccess(bookingId, user);

      if (purpose === 'folio_settle') {
        const { booking } = await loadBookingWithGuest(bookingId);
        assertCheckedIn(booking);
      }

      const [row] = await db
        .select({
          booking: bookings,
          guestFirstName: guests.firstName,
          guestLastName: guests.lastName,
        })
        .from(bookings)
        .innerJoin(guests, eq(bookings.guestId, guests.id))
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (!row?.booking.tenantId) {
        return errorResponse('Booking not found', 404, 'NOT_FOUND');
      }

      let amount = parsed.data.amount;
      if (purpose === 'folio_settle') {
        const folio = await folioService.getFolio(bookingId);
        if (folio.balanceDue <= 0) {
          return errorResponse('No folio balance due', 400, 'NO_BALANCE');
        }
        amount = amount ?? folio.balanceDue;
      } else {
        const ps = (row.booking.paymentStatus || '').toLowerCase();
        if (ps === 'paid') {
          return errorResponse('Booking deposit is already paid', 400, 'ALREADY_PAID');
        }
        amount = amount ?? Number.parseFloat(String(row.booking.totalAmount));
      }

      if (!amount || amount <= 0) {
        return errorResponse('Invalid payment amount', 400, 'INVALID_AMOUNT');
      }

      const merchantReference = AdumoVirtualService.buildMerchantReference(bookingId);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.insert(paymentSessions).values({
        tenantId: row.booking.tenantId,
        merchantReference,
        bookingId,
        amount: amount.toFixed(2),
        purpose,
        beneficiary: 'property',
        status: 'pending',
        sessionData: { returnSuccessUrl, returnFailUrl, userId: user.id },
        expiresAt,
      });

      const recipient =
        [row.guestFirstName, row.guestLastName].filter(Boolean).join(' ') || 'Guest';

      const form = AdumoVirtualService.buildFormPayload({
        amount,
        merchantReference,
        recipientName: recipient,
        orderDescription:
          purpose === 'folio_settle'
            ? `Folio settlement — ${row.booking.bookingReference}`
            : `Booking — ${row.booking.bookingReference}`,
        variable1: bookingId,
        redirectSuccessUrl: returnSuccessUrl,
        redirectFailedUrl: returnFailUrl,
      });

      return successResponse({
        actionUrl: form.actionUrl,
        fields: form.fields,
        merchantReference,
      });
    },
    { rateLimit: true }
  );
}

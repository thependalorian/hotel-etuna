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
import { resolveBookingDepositAmount } from '@/lib/booking/deposit';
import { PsdFraudGate } from '@/lib/services/fraud/FraudDetectionService';
import { logSecurityIncident } from '@/lib/services/security/SecurityIncidentService';

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
        amount = amount ?? resolveBookingDepositAmount(row.booking);
      }

      if (!amount || amount <= 0) {
        return errorResponse('Invalid payment amount', 400, 'INVALID_AMOUNT');
      }

      // PSD-12: synchronous fraud gate on the live card-initiation path.
      // Reason: block high-risk deposits/folio settlements BEFORE a hosted Adumo
      // session is created; PsdFraudGate fails closed in production.
      const fraud = await PsdFraudGate.checkTransaction({
        userId: user.id,
        tenantId: row.booking.tenantId,
        transactionAmount: amount,
        transactionCurrency: 'NAD',
        transactionType: 'payment',
        ipAddress:
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          req.headers.get('x-real-ip') ||
          undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        deviceId: req.headers.get('x-device-id') || undefined,
        metadata: { bookingId, purpose, merchantRail: 'adumo_virtual' },
      });

      if (fraud.blocked) {
        await logSecurityIncident(
          'fraud_detected',
          'critical',
          'Adumo Virtual initiation blocked: high fraud risk',
          `Card payment of NAD ${amount.toFixed(2)} blocked for booking ${bookingId} (risk ${fraud.riskScore})`,
          {
            tenantId: row.booking.tenantId,
            affectedUsers: [user.id],
            metadata: { bookingId, purpose, riskScore: fraud.riskScore, reasons: fraud.reasons },
          }
        );
        return errorResponse(
          'Payment blocked for security review. Please contact the front desk.',
          403,
          'FRAUD_RISK_TOO_HIGH'
        );
      }

      if (fraud.requiresReview) {
        await logSecurityIncident(
          'fraud_detected',
          'medium',
          'Adumo Virtual initiation flagged for review',
          `Card payment of NAD ${amount.toFixed(2)} flagged for booking ${bookingId} (risk ${fraud.riskScore})`,
          {
            tenantId: row.booking.tenantId,
            affectedUsers: [user.id],
            metadata: { bookingId, purpose, riskScore: fraud.riskScore, reasons: fraud.reasons },
          }
        );
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

/**
 * @fileoverview API route //api/payments/reconciliation
 * Location: /app/api/payments/reconciliation/route.ts
 */

/**
 * Cash Reconciliation API Endpoint
 *
 * Purpose: Daily cash-up reports for staff
 * Location: app/api/payments/reconciliation/route.ts
 *
 * Features:
 * - GET: Retrieve cash-up report for a date
 * - POST: Save daily reconciliation record
 * - Track expected vs actual cash
 * - Log discrepancies
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
import { auditTrail, bookings, cashReconciliations } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { securityLogger } from '@/lib/utils/security-logger';

const STAFF_ROLES = ['admin', 'staff', 'manager'] as const;

const reconciliationSchema = z.object({
  reconciliationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  propertyId: z.string().uuid().optional(),
  shift: z.enum(['morning', 'afternoon', 'evening', 'full_day']).optional(),
  actualAmount: z.number().min(0, 'Actual amount cannot be negative'),
  notes: z.string().optional(),
});

/**
 * GET /api/payments/reconciliation
 * Retrieve cash-up report for a specific date
 */
export async function GET(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      try {
        const searchParams = req.nextUrl.searchParams;
        const date = searchParams.get('date');
        const propertyId = searchParams.get('propertyId');
        const shift = searchParams.get('shift');

        if (!date) {
          return errorResponse('Missing required parameter: date (format: YYYY-MM-DD)', 400);
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return errorResponse('Invalid date format. Use YYYY-MM-DD', 400);
        }

        const conditions = [
          eq(bookings.paymentMethod, 'cash'),
          gte(bookings.checkInDate, date),
          lte(bookings.checkInDate, date),
        ];

        if (propertyId) {
          conditions.push(eq(bookings.propertyId, propertyId));
        }

        const cashBookings = await db
          .select({
            id: bookings.id,
            bookingReference: bookings.bookingReference,
            totalAmount: bookings.totalAmount,
            amountTendered: bookings.amountTendered,
            changeGiven: bookings.changeGiven,
            receiptNumber: bookings.receiptNumber,
            paymentStatus: bookings.paymentStatus,
            checkInDate: bookings.checkInDate,
            createdAt: bookings.createdAt,
          })
          .from(bookings)
          .where(and(...conditions));

        const paidBookings = cashBookings.filter((b) => b.paymentStatus === 'paid');
        const pendingBookings = cashBookings.filter((b) => b.paymentStatus !== 'paid');

        const expectedCash = paidBookings.reduce(
          (sum, booking) => sum + parseFloat(booking.totalAmount || '0'),
          0
        );

        const totalTendered = paidBookings.reduce(
          (sum, booking) => sum + parseFloat(booking.amountTendered || '0'),
          0
        );

        const totalChange = paidBookings.reduce(
          (sum, booking) => sum + parseFloat(booking.changeGiven || '0'),
          0
        );

        const existingReconciliationConditions = [eq(cashReconciliations.reconciliationDate, date)];

        if (propertyId) {
          existingReconciliationConditions.push(eq(cashReconciliations.propertyId, propertyId));
        }

        if (shift) {
          existingReconciliationConditions.push(eq(cashReconciliations.shift, shift));
        }

        const existingReconciliation = await db
          .select()
          .from(cashReconciliations)
          .where(and(...existingReconciliationConditions))
          .limit(1);

        return successResponse({
          date,
          propertyId: propertyId || null,
          shift: shift || 'full_day',
          bookings: {
            total: cashBookings.length,
            paid: paidBookings.length,
            pending: pendingBookings.length,
            details: cashBookings.map((b) => ({
              bookingReference: b.bookingReference,
              totalAmount: parseFloat(b.totalAmount),
              amountTendered: b.amountTendered ? parseFloat(b.amountTendered) : null,
              changeGiven: b.changeGiven ? parseFloat(b.changeGiven) : null,
              receiptNumber: b.receiptNumber,
              paymentStatus: b.paymentStatus,
              checkInDate: b.checkInDate,
            })),
          },
          amounts: {
            expectedCash: expectedCash.toFixed(2),
            totalTendered: totalTendered.toFixed(2),
            totalChange: totalChange.toFixed(2),
            netExpected: expectedCash.toFixed(2),
          },
          reconciliation:
            existingReconciliation.length > 0
              ? {
                  id: existingReconciliation[0].id,
                  actualAmount: existingReconciliation[0].actualAmount,
                  discrepancy: existingReconciliation[0].discrepancy,
                  notes: existingReconciliation[0].notes,
                  staffId: existingReconciliation[0].staffId,
                  createdAt: existingReconciliation[0].createdAt,
                }
              : null,
        });
      } catch (error) {
        securityLogger.error('[GET RECONCILIATION ERROR]', error);
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
 * POST /api/payments/reconciliation
 * Save daily cash reconciliation record
 */
export async function POST(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      try {
        const body = await req.json();
        const validation = reconciliationSchema.safeParse(body);

        if (!validation.success) {
          return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', validation.error.issues);
        }

        const { reconciliationDate, propertyId, shift, actualAmount, notes } = validation.data;

        const conditions = [
          eq(bookings.paymentMethod, 'cash'),
          eq(bookings.paymentStatus, 'paid'),
          gte(bookings.checkInDate, reconciliationDate),
          lte(bookings.checkInDate, reconciliationDate),
        ];

        if (propertyId) {
          conditions.push(eq(bookings.propertyId, propertyId));
        }

        const cashBookings = await db
          .select({ totalAmount: bookings.totalAmount })
          .from(bookings)
          .where(and(...conditions));

        const expectedAmount = cashBookings.reduce(
          (sum, booking) => sum + parseFloat(booking.totalAmount || '0'),
          0
        );

        const discrepancy = actualAmount - expectedAmount;

        const existingConditions = [eq(cashReconciliations.reconciliationDate, reconciliationDate)];

        if (propertyId) {
          existingConditions.push(eq(cashReconciliations.propertyId, propertyId));
        }

        if (shift) {
          existingConditions.push(eq(cashReconciliations.shift, shift));
        }

        const existing = await db
          .select()
          .from(cashReconciliations)
          .where(and(...existingConditions))
          .limit(1);

        let reconciliation;

        if (existing.length > 0) {
          [reconciliation] = await db
            .update(cashReconciliations)
            .set({
              expectedAmount: expectedAmount.toString(),
              actualAmount: actualAmount.toString(),
              discrepancy: discrepancy.toString(),
              notes,
              staffId: user.id,
              updatedAt: new Date(),
            })
            .where(eq(cashReconciliations.id, existing[0].id))
            .returning();
        } else {
          [reconciliation] = await db
            .insert(cashReconciliations)
            .values({
              tenantId: user.tenantId || null,
              propertyId: propertyId || null,
              reconciliationDate,
              shift: shift || 'full_day',
              expectedAmount: expectedAmount.toString(),
              actualAmount: actualAmount.toString(),
              discrepancy: discrepancy.toString(),
              notes,
              staffId: user.id,
            })
            .returning();
        }

        await db.insert(auditTrail).values({
          tenantId: user.tenantId || null,
          userId: user.id,
          action:
            existing.length > 0 ? 'cash_reconciliation_updated' : 'cash_reconciliation_created',
          resourceType: 'cash_reconciliation',
          resourceId: reconciliation.id,
          oldValues: existing[0]
            ? {
                expectedAmount: existing[0].expectedAmount,
                actualAmount: existing[0].actualAmount,
                discrepancy: existing[0].discrepancy,
                notes: existing[0].notes,
              }
            : null,
          newValues: {
            expectedAmount,
            actualAmount,
            discrepancy,
            notes: notes ?? null,
            reconciliationDate,
            shift: shift || 'full_day',
          },
          ipAddress: req.headers.get('x-forwarded-for') ?? null,
          userAgent: req.headers.get('user-agent') ?? null,
        });

        return successResponse({
          message: 'Reconciliation saved successfully',
          reconciliation: {
            id: reconciliation.id,
            reconciliationDate: reconciliation.reconciliationDate,
            expectedAmount: parseFloat(reconciliation.expectedAmount),
            actualAmount: parseFloat(reconciliation.actualAmount),
            discrepancy: parseFloat(reconciliation.discrepancy || '0'),
            notes: reconciliation.notes,
            shift: reconciliation.shift,
            createdAt: reconciliation.createdAt,
          },
        });
      } catch (error) {
        securityLogger.error('[POST RECONCILIATION ERROR]', error);
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

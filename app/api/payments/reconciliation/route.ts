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

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { auditTrail, bookings, cashReconciliations } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

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
 * 
 * Query params:
 * - date: YYYY-MM-DD (required)
 * - propertyId: UUID (optional, defaults to user's property)
 * - shift: morning|afternoon|evening|full_day (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
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
        { error: 'Forbidden: Only staff can access reconciliation reports' },
        { status: 403 }
      );
    }

    // 3. Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const propertyId = searchParams.get('propertyId');
    const shift = searchParams.get('shift');

    if (!date) {
      return NextResponse.json(
        { error: 'Missing required parameter: date (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // 4. Query cash bookings for the date
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    // Build query conditions
    const conditions = [
      eq(bookings.paymentMethod, 'cash'),
      gte(bookings.checkInDate, date),
      lte(bookings.checkInDate, date),
    ];

    if (propertyId) {
      conditions.push(eq(bookings.propertyId, propertyId));
    }

    // Fetch cash bookings
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

    // 5. Calculate expected amounts
    const paidBookings = cashBookings.filter(b => b.paymentStatus === 'paid');
    const pendingBookings = cashBookings.filter(b => b.paymentStatus !== 'paid');

    const expectedCash = paidBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.totalAmount || '0');
    }, 0);

    const totalTendered = paidBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.amountTendered || '0');
    }, 0);

    const totalChange = paidBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.changeGiven || '0');
    }, 0);

    // 6. Check if reconciliation already exists
    const existingReconciliationConditions = [
      eq(cashReconciliations.reconciliationDate, date),
    ];

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

    // 7. Return report
    return NextResponse.json({
      success: true,
      report: {
        date,
        propertyId: propertyId || null,
        shift: shift || 'full_day',
        bookings: {
          total: cashBookings.length,
          paid: paidBookings.length,
          pending: pendingBookings.length,
          details: cashBookings.map(b => ({
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
          netExpected: (expectedCash).toFixed(2), // What should be in cash drawer
        },
        reconciliation: existingReconciliation.length > 0 ? {
          id: existingReconciliation[0].id,
          actualAmount: existingReconciliation[0].actualAmount,
          discrepancy: existingReconciliation[0].discrepancy,
          notes: existingReconciliation[0].notes,
          staffId: existingReconciliation[0].staffId,
          createdAt: existingReconciliation[0].createdAt,
        } : null,
      },
    });

  } catch (error) {
    console.error('[GET RECONCILIATION ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/reconciliation
 * Save daily cash reconciliation record
 * 
 * Body:
 * - reconciliationDate: YYYY-MM-DD (required)
 * - propertyId: UUID (optional)
 * - shift: morning|afternoon|evening|full_day (optional)
 * - actualAmount: number (required)
 * - notes: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
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
        { error: 'Forbidden: Only staff can submit reconciliations' },
        { status: 403 }
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const validation = reconciliationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reconciliationDate, propertyId, shift, actualAmount, notes } = validation.data;

    // 4. Calculate expected amount for this date
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
      .select({
        totalAmount: bookings.totalAmount,
      })
      .from(bookings)
      .where(and(...conditions));

    const expectedAmount = cashBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.totalAmount || '0');
    }, 0);

    // 5. Calculate discrepancy
    const discrepancy = actualAmount - expectedAmount;

    // 6. Check for existing reconciliation
    const existingConditions = [
      eq(cashReconciliations.reconciliationDate, reconciliationDate),
    ];

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

    // 7. Insert or update reconciliation
    let reconciliation;

    if (existing.length > 0) {
      // Update existing
      [reconciliation] = await db
        .update(cashReconciliations)
        .set({
          expectedAmount: expectedAmount.toString(),
          actualAmount: actualAmount.toString(),
          discrepancy: discrepancy.toString(),
          notes,
          staffId: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(cashReconciliations.id, existing[0].id))
        .returning();
    } else {
      // Create new
      [reconciliation] = await db
        .insert(cashReconciliations)
        .values({
          tenantId: session.user.tenantId || null,
          propertyId: propertyId || null,
          reconciliationDate,
          shift: shift || 'full_day',
          expectedAmount: expectedAmount.toString(),
          actualAmount: actualAmount.toString(),
          discrepancy: discrepancy.toString(),
          notes,
          staffId: session.user.id,
        })
        .returning();
    }

    // 8. Persist audit trail for reconciliation
    await db.insert(auditTrail).values({
      tenantId: session.user.tenantId || null,
      userId: session.user.id,
      action: existing.length > 0 ? 'cash_reconciliation_updated' : 'cash_reconciliation_created',
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
      ipAddress: request.headers.get('x-forwarded-for') ?? null,
      userAgent: request.headers.get('user-agent') ?? null,
    });

    return NextResponse.json({
      success: true,
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
    console.error('[POST RECONCILIATION ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

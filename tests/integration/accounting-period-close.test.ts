/**
 * Integration tests: accounting period close (OSS W4 dubbl port).
 * Location: tests/integration/accounting-period-close.test.ts
 *
 * Tests draft folio guard, period lock creation, and immutability.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HospitalityAccountingService } from '@/lib/services/accounting/HospitalityAccountingService';
import { db, tenants, properties, guests, users, bookingCharges, bookings } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const accountingService = new HospitalityAccountingService();

describe('HospitalityAccountingService - period close', () => {
  let testTenantId: string;
  let testPropertyId: string;
  let testBookingId: string;
  let testUserId: string;

  beforeAll(async () => {
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: 'Test Tenant - Accounting Close',
        slug: `test-accounting-${Date.now()}`,
        tenantType: 'hub',
      })
      .returning();
    testTenantId = tenant.id;

    const [property] = await db
      .insert(properties)
      .values({
        tenantId: testTenantId,
        name: 'Test Property - Close',
        slug: `test-property-close-${Date.now()}`,
        type: 'hotel',
        country: 'Namibia',
        currency: 'NAD',
      })
      .returning();
    testPropertyId = property.id;

    const passwordHash = await bcrypt.hash('TestPassword123!', 10);
    const [user] = await db
      .insert(users)
      .values({
        tenantId: testTenantId,
        email: `accounting-close-user-${Date.now()}@example.com`,
        passwordHash,
        firstName: 'Close',
        lastName: 'Tester',
        role: 'admin',
        status: 'active',
      })
      .returning();
    testUserId = user.id;

    const [guest] = await db
      .insert(guests)
      .values({
        tenantId: testTenantId,
        email: `accounting-close-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Guest',
      })
      .returning();

    const [booking] = await db
      .insert(bookings)
      .values({
        tenantId: testTenantId,
        propertyId: testPropertyId,
        guestId: guest.id,
        bookingReference: `BOOK-CLOSE-${Date.now()}`,
        checkInDate: new Date('2026-06-01'),
        checkOutDate: new Date('2026-06-03'),
        totalAmount: '500.00',
        status: 'confirmed',
        bookingKind: 'accommodation',
      })
      .returning();
    testBookingId = booking.id;
  });

  afterAll(async () => {
    if (testTenantId) {
      await db.delete(tenants).where(eq(tenants.id, testTenantId));
    }
  });

  it('should block period close when draft folio charges exist', async () => {
    await db.insert(bookingCharges).values({
      tenantId: testTenantId,
      bookingId: testBookingId,
      chargeType: 'room',
      description: 'Test room charge - open',
      amount: '100',
      status: 'open',
      createdAt: new Date('2026-06-01'),
    });

    const result = await accountingService.closeAccountingPeriod(
      testTenantId,
      testPropertyId,
      new Date('2026-06-30'),
      testUserId
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('unsettled folio');
    expect(result.draftChargeCount).toBeGreaterThan(0);

    await db
      .delete(bookingCharges)
      .where(eq(bookingCharges.tenantId, testTenantId));
  });

  it('should allow period close when all charges are settled', async () => {
    await db.insert(bookingCharges).values({
      tenantId: testTenantId,
      bookingId: testBookingId,
      chargeType: 'room',
      description: 'Test room charge - settled',
      amount: '200',
      status: 'settled',
      settledAt: new Date('2026-06-02'),
      createdAt: new Date('2026-06-01'),
    });

    const result = await accountingService.closeAccountingPeriod(
      testTenantId,
      testPropertyId,
      new Date('2026-06-30'),
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.lockDate).toBe('2026-06-30');
    expect(result.closedBy).toBe(testUserId);

    await db
      .delete(bookingCharges)
      .where(eq(bookingCharges.tenantId, testTenantId));
  });

  it('should block duplicate period close for same date', async () => {
    const result = await accountingService.closeAccountingPeriod(
      testTenantId,
      testPropertyId,
      new Date('2026-06-30'),
      testUserId
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('already closed');
  });

  it('should return latest period lock for property', async () => {
    const lock = await accountingService.getPeriodLock(testTenantId, testPropertyId);

    expect(lock).not.toBeNull();
    expect(lock?.lockDate).toBe('2026-06-30');
    expect(lock?.propertyId).toBe(testPropertyId);
  });

  it('should detect locked dates correctly', async () => {
    const isLocked = await accountingService.isDateLocked(
      testTenantId,
      testPropertyId,
      new Date('2026-06-15')
    );

    expect(isLocked).toBe(true);

    const isNotLocked = await accountingService.isDateLocked(
      testTenantId,
      testPropertyId,
      new Date('2026-07-01')
    );

    expect(isNotLocked).toBe(false);
  });

  it('should count draft charges accurately', async () => {
    await db.insert(bookingCharges).values([
      {
        tenantId: testTenantId,
        bookingId: testBookingId,
        chargeType: 'room',
        description: 'Draft charge 1',
        amount: '50',
        status: 'open',
        createdAt: new Date('2026-07-01'),
      },
      {
        tenantId: testTenantId,
        bookingId: testBookingId,
        chargeType: 'fnb',
        description: 'Draft charge 2',
        amount: '30',
        status: 'open',
        createdAt: new Date('2026-07-02'),
      },
    ]);

    const count = await accountingService.countUnsettledDraftCharges(
      testTenantId,
      testPropertyId,
      new Date('2026-07-31')
    );

    expect(count).toBe(2);

    await db
      .delete(bookingCharges)
      .where(eq(bookingCharges.tenantId, testTenantId));
  });

  it('should generate year-end closing lines correctly', async () => {
    const trialBalance = [
      { accountCode: '4100', accountType: 'revenue', balance: 50000 },
      { accountCode: '4200', accountType: 'revenue', balance: 10000 },
      { accountCode: '5100', accountType: 'expense', balance: 8000 },
      { accountCode: '5200', accountType: 'expense', balance: 2000 },
      { accountCode: '1100', accountType: 'asset', balance: 15000 },
    ];

    const closingLines = accountingService.generateYearEndClosingLines(
      trialBalance,
      new Date('2026-12-31'),
      'NAD'
    );

    expect(closingLines.length).toBeGreaterThan(0);

    const revenueLines = closingLines.filter((l) => l.accountCode.startsWith('4'));
    const expenseLines = closingLines.filter((l) => l.accountCode.startsWith('5'));
    const retainedEarningsLine = closingLines.find((l) => l.accountCode === '3100');

    expect(revenueLines.length).toBe(2);
    expect(expenseLines.length).toBe(2);
    expect(retainedEarningsLine).toBeDefined();

    const totalRevenueDebit = revenueLines.reduce((sum, l) => sum + l.debit, 0);
    const totalExpenseCredit = expenseLines.reduce((sum, l) => sum + l.credit, 0);
    const netIncome = totalRevenueDebit - totalExpenseCredit;

    expect(retainedEarningsLine?.credit).toBe(netIncome);

    const totalDebits = closingLines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredits = closingLines.reduce((sum, l) => sum + l.credit, 0);
    expect(Math.abs(totalDebits - totalCredits)).toBeLessThan(0.01);
  });
});

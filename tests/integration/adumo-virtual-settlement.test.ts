/**
 * Adumo Virtual settlement integration — completeAdumoVirtualPayment idempotency
 * Location: tests/integration/adumo-virtual-settlement.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { bookings, paymentSessions, transactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { completeAdumoVirtualPayment } from '@/lib/services/payment/completeAdumoVirtualPayment';
import {
  cleanupTestData,
  createTestBooking,
  createTestGuest,
  createTestProperty,
  createTestRoom,
  createTestTenant,
  createTestUser,
} from '../utils/test-helpers';

const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.TEST_DATABASE_URL);

const MERCHANT_UID = process.env.ADUMO_MERCHANT_UID || '9BA5008C-08EE-4286-A349-54AF91A621B0';
const APPLICATION_UID = process.env.ADUMO_APPLICATION_UID || '23ADADC0-DA2D-4DAC-A128-4845A5D71293';
const JWT_SECRET = process.env.ADUMO_JWT_SECRET || 'yglTxLCSMm7PEsfaMszAKf2LSRvM2qVW';

function buildSuccessToken(merchantReference: string, amount: string, transactionIndex: string) {
  return jwt.sign(
    {
      cuid: MERCHANT_UID,
      auid: APPLICATION_UID,
      result: 0,
      mref: merchantReference,
      amount,
      transactionIndex,
    },
    JWT_SECRET,
    { algorithm: 'HS256' },
  );
}

describe.skipIf(!hasDatabase)('completeAdumoVirtualPayment — booking_deposit', () => {
  let tenantId: string;
  let bookingId: string;
  let merchantReference: string;
  const sessionAmount = '250.00';
  const transactionIndex = `tx-int-${Date.now()}`;

  beforeAll(async () => {
    const tenant = await createTestTenant('Adumo Settlement Tenant');
    tenantId = tenant.id;
    const user = await createTestUser(tenantId);
    const property = await createTestProperty(tenantId, user.id, 'Adumo Test Hotel');
    const room = await createTestRoom(property.id, undefined, undefined, tenantId);
    const guest = await createTestGuest(tenantId);
    const booking = await createTestBooking(tenantId, property.id, guest.id, room.id);
    bookingId = booking.id;
    merchantReference = `HE${bookingId.replace(/-/g, '').slice(0, 12)}${Date.now().toString(36)}`.slice(0, 38);

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await runWithTenantContext(tenantId, async () => {
      await db.insert(paymentSessions).values({
        tenantId,
        merchantReference,
        bookingId,
        amount: sessionAmount,
        purpose: 'booking_deposit',
        beneficiary: 'property',
        status: 'pending',
        expiresAt,
      });
    });
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('settles pending session → success transaction and paid booking', async () => {
    const token = buildSuccessToken(merchantReference, sessionAmount, transactionIndex);
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    const result = await runWithTenantContext(tenantId, async () =>
      completeAdumoVirtualPayment({
        merchantReference,
        transactionIndex,
        decoded: {
          result: Number(decoded.result),
          mref: String(decoded.mref),
          amount: String(decoded.amount),
          cuid: String(decoded.cuid),
          auid: String(decoded.auid),
          transactionIndex: String(decoded.transactionIndex),
          raw: decoded,
        },
      }),
    );

    expect(result.alreadyProcessed).toBe(false);
    expect(result.bookingId).toBe(bookingId);

    await runWithTenantContext(tenantId, async () => {
      const [session] = await db
        .select()
        .from(paymentSessions)
        .where(eq(paymentSessions.merchantReference, merchantReference))
        .limit(1);
      expect(session?.status).toBe('success');
      expect(session?.adumoTransactionIndex).toBe(transactionIndex);

      const [booking] = await db
        .select({ paymentStatus: bookings.paymentStatus })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);
      expect(booking?.paymentStatus).toBe('paid');

      const txRows = await db
        .select()
        .from(transactions)
        .where(eq(transactions.bookingId, bookingId));
      expect(txRows.length).toBeGreaterThanOrEqual(1);
      expect(txRows.some((t) => t.paymentGateway === 'adumo_virtual')).toBe(true);
    });
  });

  it('second completion returns alreadyProcessed without duplicate transactions', async () => {
    const token = buildSuccessToken(merchantReference, sessionAmount, transactionIndex);
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    const result = await runWithTenantContext(tenantId, async () =>
      completeAdumoVirtualPayment({
        merchantReference,
        transactionIndex,
        decoded: {
          result: Number(decoded.result),
          mref: String(decoded.mref),
          amount: String(decoded.amount),
          cuid: String(decoded.cuid),
          auid: String(decoded.auid),
          transactionIndex: String(decoded.transactionIndex),
          raw: decoded,
        },
      }),
    );

    expect(result.alreadyProcessed).toBe(true);

    await runWithTenantContext(tenantId, async () => {
      const txRows = await db
        .select()
        .from(transactions)
        .where(eq(transactions.bookingId, bookingId));
      const adumoTx = txRows.filter((t) => t.paymentGateway === 'adumo_virtual');
      expect(adumoTx.length).toBe(1);
    });
  });
});

describe.skipIf(!hasDatabase)('completeAdumoVirtualPayment — amount mismatch', () => {
  let tenantId: string;
  let merchantReference: string;

  beforeAll(async () => {
    const tenant = await createTestTenant('Adumo Mismatch Tenant');
    tenantId = tenant.id;
    const user = await createTestUser(tenantId);
    const property = await createTestProperty(tenantId, user.id, 'Mismatch Hotel');
    const room = await createTestRoom(property.id, undefined, undefined, tenantId);
    const guest = await createTestGuest(tenantId);
    const booking = await createTestBooking(tenantId, property.id, guest.id, room.id);
    merchantReference = `HEM${booking.id.replace(/-/g, '').slice(0, 10)}${Date.now().toString(36)}`.slice(0, 38);

    await runWithTenantContext(tenantId, async () => {
      await db.insert(paymentSessions).values({
        tenantId,
        merchantReference,
        bookingId: booking.id,
        amount: '100.00',
        purpose: 'booking_deposit',
        beneficiary: 'property',
        status: 'pending',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
    });
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('rejects when JWT amount does not match session', async () => {
    const token = buildSuccessToken(merchantReference, '999.00', 'tx-mismatch');
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    await expect(
      runWithTenantContext(tenantId, async () =>
        completeAdumoVirtualPayment({
          merchantReference,
          transactionIndex: 'tx-mismatch',
          decoded: {
            result: 0,
            mref: merchantReference,
            amount: '999.00',
            cuid: MERCHANT_UID,
            auid: APPLICATION_UID,
            transactionIndex: 'tx-mismatch',
            raw: decoded,
          },
        }),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

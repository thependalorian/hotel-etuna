/**
 * Availability ledger service unit tests (OSS W6).
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockSelect, mockInsert } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    db: {
      ...actual.db,
      select: mockSelect,
      insert: mockInsert,
    },
  };
});

import {
  AvailabilityLedgerService,
  generateStayNightDates,
  isLedgerRowBlockingSale,
} from '@/lib/services/property/AvailabilityLedgerService';

function propertySelectChain(result: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function roomsSelectChain(result: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(result),
    }),
  };
}

describe('availability ledger helpers', () => {
  it('generateStayNightDates returns check-in inclusive, check-out exclusive', () => {
    const nights = generateStayNightDates(
      new Date('2026-06-10T00:00:00.000Z'),
      new Date('2026-06-13T00:00:00.000Z')
    );
    expect(nights).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']);
  });

  it('isLedgerRowBlockingSale respects stop-sell, blocked, and sold', () => {
    expect(
      isLedgerRowBlockingSale({
        blocked: 0,
        outOfOrder: false,
        stopSell: true,
        sold: 0,
      })
    ).toBe(true);
    expect(
      isLedgerRowBlockingSale({
        blocked: 1,
        outOfOrder: false,
        stopSell: false,
        sold: 0,
      })
    ).toBe(true);
    expect(
      isLedgerRowBlockingSale(
        { blocked: 0, outOfOrder: false, stopSell: false, sold: 1 },
        { ignoreSold: true }
      )
    ).toBe(false);
  });
});

describe('AvailabilityLedgerService.applyStopSell', () => {
  const service = new AvailabilityLedgerService();
  const tenantId = '22222222-2222-4222-8222-222222222222';
  const propertyId = '33333333-3333-4333-8333-333333333333';
  const roomId = '44444444-4444-4444-8444-444444444444';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upserts stop-sell for all guest rooms when roomId omitted', async () => {
    mockSelect
      .mockReturnValueOnce(propertySelectChain([{ id: propertyId }]))
      .mockReturnValueOnce(roomsSelectChain([{ id: roomId }]))
      .mockReturnValueOnce(propertySelectChain([{ id: propertyId }]))
      .mockReturnValueOnce(propertySelectChain([{ id: roomId }]));

    const returning = vi.fn().mockResolvedValue([
      {
        id: '55555555-5555-4555-8555-555555555555',
        tenantId,
        propertyId,
        roomId,
        businessDate: '2026-06-15',
        stopSell: true,
        sold: 0,
        blocked: 0,
        outOfOrder: false,
        cta: false,
        ctd: false,
      },
    ]);
    const onConflictDoUpdate = vi.fn().mockReturnValue({ returning });
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoUpdate }),
    });

    const rows = await service.applyStopSell({
      tenantId,
      propertyId,
      businessDate: '2026-06-15',
      stopSell: true,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].stopSell).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it('rejects property outside tenant', async () => {
    mockSelect.mockReturnValueOnce(propertySelectChain([]));

    await expect(
      service.applyStopSell({
        tenantId,
        propertyId,
        businessDate: '2026-06-15',
        stopSell: true,
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

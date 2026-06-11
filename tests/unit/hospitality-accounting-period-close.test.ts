/**
 * GL period close guard — unsettled folio charges block close (OSS W4 / dubbl draft pattern).
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
  draftEntryGuardMessage,
  HospitalityAccountingService,
} from '@/lib/services/accounting/HospitalityAccountingService';

function propertySelectChain(result: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function lockSelectChain(result: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  };
}

function draftCountChain(count: number) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count }]),
      }),
    }),
  };
}

describe('draftEntryGuardMessage', () => {
  it('returns empty string when no drafts', () => {
    expect(draftEntryGuardMessage(0)).toBe('');
  });

  it('describes a single unsettled charge', () => {
    expect(draftEntryGuardMessage(1)).toContain('1 unsettled folio charge');
    expect(draftEntryGuardMessage(1)).toContain('Cannot close period');
  });

  it('describes multiple unsettled charges', () => {
    expect(draftEntryGuardMessage(3)).toContain('3 unsettled folio charges');
  });
});

describe('HospitalityAccountingService.closeAccountingPeriod', () => {
  const service = new HospitalityAccountingService();
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const propertyId = '22222222-2222-2222-2222-222222222222';
  const periodEnd = new Date('2026-05-31T23:59:59.999Z');

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { createdAt: new Date('2026-06-01T10:00:00Z') },
        ]),
      }),
    });
  });

  it('blocks close when unsettled folio charges exist', async () => {
    mockSelect
      .mockReturnValueOnce(propertySelectChain([{ id: propertyId }]))
      .mockReturnValueOnce(lockSelectChain([]))
      .mockReturnValueOnce(draftCountChain(2));

    const result = await service.closeAccountingPeriod(tenantId, propertyId, periodEnd);

    expect(result.success).toBe(false);
    expect(result.draftChargeCount).toBe(2);
    expect(result.error).toBe(draftEntryGuardMessage(2));
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns error when property is not found', async () => {
    mockSelect.mockReturnValueOnce(propertySelectChain([]));

    const result = await service.closeAccountingPeriod(tenantId, propertyId, periodEnd);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Property not found');
  });
});

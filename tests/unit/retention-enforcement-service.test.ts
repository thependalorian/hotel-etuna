/**
 * RetentionEnforcementService unit tests — dry-run default and flag transition contract.
 * Location: tests/unit/retention-enforcement-service.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSelect, mockUpdate, mockInsert } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
  },
}));

import { RetentionEnforcementService } from '@/lib/services/compliance/RetentionEnforcementService';

const sampleRows = [
  {
    id: 'r1',
    tenantId: '00000000-0000-0000-0000-000000000099',
    recordType: 'booking',
    recordId: 'b1',
  },
];

describe('RetentionEnforcementService', () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockUpdate.mockReset();
    mockInsert.mockReset();
  });

  it('enforce dry-run counts expired rows without updating', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(sampleRows),
      }),
    });

    const result = await RetentionEnforcementService.enforce({ dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.expiredCount).toBe(1);
    expect(result.flagged).toBe(0);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('enforce dryRun false flags expired active records', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(sampleRows),
      }),
    });
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'r1' }]),
        }),
      }),
    });
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const result = await RetentionEnforcementService.enforce({
      dryRun: false,
      tenantId: '00000000-0000-0000-0000-000000000099',
    });

    expect(result.flagged).toBe(1);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('expiredCount returns aggregate from db', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ n: 5 }]),
      }),
    });

    const n = await RetentionEnforcementService.expiredCount();
    expect(n).toBe(5);
  });
});

/**
 * SofiaChatRetentionService unit tests — 24-month cutoff and dry-run contract.
 * Location: tests/unit/sofia-chat-retention.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSelect, mockDelete, mockInsertValues } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockDelete: vi.fn(),
  mockInsertValues: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: mockSelect,
    delete: mockDelete,
    insert: vi.fn().mockReturnValue({ values: mockInsertValues }),
  },
  auditTrail: {},
}));

vi.mock('@/lib/db/schema', () => ({
  aiConversations: { createdAt: 'createdAt', tenantId: 'tenantId', id: 'id' },
  auditTrail: {},
}));

import { SofiaChatRetentionService } from '@/lib/services/compliance/SofiaChatRetentionService';

function countChain(count: number) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ count }]),
    }),
  };
}

describe('SofiaChatRetentionService', () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockDelete.mockReset();
  });

  it('getCutoffDate is approximately 24 months ago', () => {
    const cutoff = SofiaChatRetentionService.getCutoffDate();
    const monthsAgo =
      (Date.now() - cutoff.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    expect(monthsAgo).toBeGreaterThan(23);
    expect(monthsAgo).toBeLessThan(25);
  });

  it('enforce dry-run counts conversations without deleting', async () => {
    mockSelect.mockReturnValue(countChain(3));

    const result = await SofiaChatRetentionService.enforce({ dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.conversationCount).toBe(3);
    expect(result.deleted).toBe(0);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('enforce with dryRun false deletes when count > 0', async () => {
    mockSelect.mockReturnValue(countChain(2));
    const returning = vi.fn().mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    mockDelete.mockReturnValue({
      where: vi.fn().mockReturnValue({ returning }),
    });

    const result = await SofiaChatRetentionService.enforce({
      dryRun: false,
      tenantId: '00000000-0000-0000-0000-000000000099',
    });

    expect(result.deleted).toBe(2);
    expect(mockDelete).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalled();
  });
});

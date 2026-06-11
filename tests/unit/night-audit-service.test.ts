/**
 * Night audit service unit tests — state machine alignment + persistence contract.
 * Location: tests/unit/night-audit-service.test.ts
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  assertTransition,
  validateTransition,
  type ReservationStatus,
} from '@/lib/services/booking/ReservationStateMachine';
import { BOOKING_STATUS_TRANSITIONS } from '@/lib/workflows/domainTransitions';

const { mockInsert } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
}));

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    db: {
      ...actual.db,
      insert: mockInsert,
      select: vi.fn(),
      update: vi.fn(),
      transaction: vi.fn(),
    },
  };
});

import { NightAuditService } from '@/lib/services/booking/NightAuditService';

describe('ReservationStateMachine W5 transitions', () => {
  it('allows assigned → checked_in', () => {
    expect(validateTransition('assigned', 'checked_in')).toBe(true);
    expect(() => assertTransition('assigned', 'checked_in')).not.toThrow();
  });

  it('allows checked_in → stayover → due_out → checked_out', () => {
    expect(validateTransition('checked_in', 'stayover')).toBe(true);
    expect(validateTransition('stayover', 'due_out')).toBe(true);
    expect(validateTransition('due_out', 'checked_out')).toBe(true);
  });

  it('rejects invalid jump checked_in → due_out', () => {
    expect(validateTransition('checked_in', 'due_out')).toBe(false);
    expect(() => assertTransition('checked_in', 'due_out')).toThrow();
  });

  it('matches BOOKING_STATUS_TRANSITIONS adjacency map', () => {
    const smStates: ReservationStatus[] = [
      'pending',
      'confirmed',
      'assigned',
      'checked_in',
      'stayover',
      'due_out',
      'checked_out',
      'no_show',
      'cancelled',
    ];

    for (const state of smStates) {
      const targets = BOOKING_STATUS_TRANSITIONS[state] ?? [];
      for (const target of targets) {
        expect(validateTransition(state, target as ReservationStatus)).toBe(true);
      }
    }
  });
});

describe('NightAuditService.persistAuditRun', () => {
  beforeEach(() => {
    mockInsert.mockReset();
  });

  it('upserts audit result with completed status', async () => {
    const returning = vi.fn().mockResolvedValue([{ id: 'run-123' }]);
    const onConflictDoUpdate = vi.fn().mockReturnValue({ returning });
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    mockInsert.mockReturnValue({ values });

    const service = new NightAuditService();
    const result = {
      businessDate: '2026-06-07',
      propertyId: 'prop-1',
      tariffResult: { totalRoom: '100.00', totalTax: '15.00', count: 1, errors: [] },
      noShowResult: { count: 0, bookingIds: [], errors: [] },
      stayoverResult: { advanced: 2 },
      dueOutResult: { markedDueOut: 1 },
      revenueSummary: {
        roomRevenue: 100,
        taxRevenue: 15,
        totalRevenue: 115,
        roomsSold: 1,
        occupancyRate: 0.5,
        adr: 100,
        revpar: 50,
      },
      errors: [],
      completedAt: new Date('2026-06-08T02:00:00Z'),
    };

    const runId = await service.persistAuditRun(
      {
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        businessDate: '2026-06-07',
        userId: 'user-1',
      },
      result
    );

    expect(runId).toBe('run-123');
    expect(mockInsert).toHaveBeenCalled();
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        propertyId: 'prop-1',
        businessDate: '2026-06-07',
        status: 'completed',
        runBy: 'user-1',
      })
    );
  });

  it('marks completed_with_errors when audit errors exist', async () => {
    const returning = vi.fn().mockResolvedValue([{ id: 'run-456' }]);
    const onConflictDoUpdate = vi.fn().mockReturnValue({ returning });
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    mockInsert.mockReturnValue({ values });

    const service = new NightAuditService();
    await service.persistAuditRun(
      {
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        businessDate: '2026-06-07',
      },
      {
        businessDate: '2026-06-07',
        propertyId: 'prop-1',
        tariffResult: { totalRoom: '0', totalTax: '0', count: 0, errors: [] },
        noShowResult: { count: 0, bookingIds: [], errors: [] },
        stayoverResult: { advanced: 0 },
        dueOutResult: { markedDueOut: 0 },
        revenueSummary: {
          roomRevenue: 0,
          taxRevenue: 0,
          totalRevenue: 0,
          roomsSold: 0,
          occupancyRate: 0,
          adr: 0,
          revpar: 0,
        },
        errors: [{ message: 'tariff failed' }],
        completedAt: new Date(),
      }
    );

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed_with_errors' })
    );
  });
});

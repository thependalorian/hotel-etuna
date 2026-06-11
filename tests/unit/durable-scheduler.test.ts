/**
 * DurableScheduler unit tests — handler registration and dispatch entry point.
 * Location: tests/unit/durable-scheduler.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSelect, mockInsert, mockUpdate, mockTransaction } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    transaction: mockTransaction,
  },
}));

vi.mock('@/lib/services/booking/NightAuditService', () => ({
  nightAuditService: { runAudit: vi.fn().mockResolvedValue({}) },
}));

vi.mock('@/lib/services/payment/paymentOutbox', () => ({
  runPaymentOutboxDispatch: vi.fn().mockResolvedValue({ claimed: 0, completed: 0, failed: 0 }),
}));

vi.mock('@/lib/cron/intelligence-digest-job', () => ({
  runIntelligenceDigestJob: vi.fn().mockResolvedValue({
    cadence: 'daily',
    emailsAttempted: 0,
    emailsSent: 0,
    skippedNoSmtp: true,
    recipients: [],
  }),
}));

import {
  DurableScheduler,
  durableScheduler,
} from '@/lib/services/scheduling/DurableScheduler';
import { registerSchedulerJobHandlers } from '@/lib/services/scheduling/schedulerJobHandlers';
import { nightAuditService } from '@/lib/services/booking/NightAuditService';
import { runPaymentOutboxDispatch } from '@/lib/services/payment/paymentOutbox';
import { runIntelligenceDigestJob } from '@/lib/cron/intelligence-digest-job';

function emptyPendingTransaction() {
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                for: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };
    return fn(tx);
  });
}

describe('DurableScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emptyPendingTransaction();
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'job-1',
              tenantId: 'tenant-1',
              jobType: 'night-audit',
              idempotencyKey: 'key-1',
              payload: {},
              status: 'pending',
              attempts: 0,
              maxAttempts: 10,
              scheduledFor: new Date(),
              nextAttemptAt: new Date(),
              lastError: null,
              completedAt: null,
              executionTimeMs: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      }),
    });
  });

  it('schedules a job with idempotency key', async () => {
    const scheduler = new DurableScheduler();
    const job = await scheduler.schedule({
      tenantId: 'tenant-1',
      jobType: 'night-audit',
      idempotencyKey: 'night-audit:2026-06-07',
      payload: { propertyId: 'prop-1' },
    });

    expect(job.jobType).toBe('night-audit');
    expect(mockInsert).toHaveBeenCalled();
  });

  it('dispatchPending returns zero work when queue is empty', async () => {
    const scheduler = new DurableScheduler();
    const result = await scheduler.dispatchPending(10);
    expect(result).toEqual({ claimed: 0, completed: 0, failed: 0, skipped: 0 });
  });
});

describe('registerSchedulerJobHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emptyPendingTransaction();
  });

  it('registers handlers for core cron job types', async () => {
    registerSchedulerJobHandlers();

    type SchedulerHandler = (job: {
      tenantId?: string;
      payload?: Record<string, unknown>;
    }) => Promise<void>;

    const handlers = (durableScheduler as unknown as { handlers: Map<string, SchedulerHandler> })
      .handlers;

    const nightHandler = handlers.get('night-audit');
    const outboxHandler = handlers.get('payment-outbox-dispatch');
    const digestHandler = handlers.get('intelligence-digest');

    expect(nightHandler).toBeTypeOf('function');
    expect(outboxHandler).toBeTypeOf('function');
    expect(digestHandler).toBeTypeOf('function');

    await nightHandler?.({
      tenantId: 'tenant-1',
      payload: { propertyId: 'prop-1', businessDate: '2026-06-07' },
    });
    await outboxHandler?.({ payload: { batchSize: 10 } });
    await digestHandler?.({ payload: { cadence: 'daily', sendEmail: false } });

    expect(nightAuditService.runAudit).toHaveBeenCalled();
    expect(runPaymentOutboxDispatch).toHaveBeenCalledWith(10);
    expect(runIntelligenceDigestJob).toHaveBeenCalledWith('daily', { sendEmail: false });
  });
});

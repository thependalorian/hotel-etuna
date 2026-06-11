/**
 * Scheduler job handlers — wires durable cron jobs to existing Hotel Etuna services.
 *
 * Purpose: Register night-audit, payment-outbox-dispatch, intelligence-digest, notification-dispatch handlers.
 * Location: lib/services/scheduling/schedulerJobHandlers.ts
 */

import { runIntelligenceDigestJob, type DigestJobCadence } from '@/lib/cron/intelligence-digest-job';
import { nightAuditService } from '@/lib/services/booking/NightAuditService';
import { runPaymentOutboxDispatch } from '@/lib/services/payment/paymentOutbox';
import {
  notificationDispatchService,
  type DispatchGuestTransactionalInput,
  type DispatchNotificationInput,
} from '@/lib/services/notifications/NotificationDispatchService';
import {
  durableScheduler,
  type SchedulerJob,
} from '@/lib/services/scheduling/DurableScheduler';
import { securityLogger } from '@/lib/utils/security-logger';

let handlersRegistered = false;

function yesterdayIsoDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function parsePayload(job: SchedulerJob): Record<string, unknown> {
  return (job.payload ?? {}) as Record<string, unknown>;
}

/**
 * Register all durable scheduler handlers (idempotent).
 */
export function registerSchedulerJobHandlers(): void {
  if (handlersRegistered) {
    return;
  }

  durableScheduler.register('night-audit', async (job) => {
    const payload = parsePayload(job);
    const propertyId = String(payload.propertyId ?? '');
    const tenantId = String(payload.tenantId ?? job.tenantId);
    const businessDate = String(payload.businessDate ?? yesterdayIsoDate());

    if (!propertyId) {
      throw new Error('night-audit job missing propertyId');
    }

    await nightAuditService.runAudit({
      propertyId,
      tenantId,
      businessDate,
      userId: payload.userId != null ? String(payload.userId) : undefined,
    });
  });

  durableScheduler.register('payment-outbox-dispatch', async (job) => {
    const payload = parsePayload(job);
    const batchSize =
      typeof payload.batchSize === 'number' ? payload.batchSize : 25;
    await runPaymentOutboxDispatch(batchSize);
  });

  durableScheduler.register('intelligence-digest', async (job) => {
    const payload = parsePayload(job);
    const cadence = String(payload.cadence ?? 'daily') as DigestJobCadence;
    const sendEmail = payload.sendEmail !== false;
    await runIntelligenceDigestJob(cadence, { sendEmail });
  });

  durableScheduler.register('notification-dispatch', async (job) => {
    const payload = parsePayload(job);
    const mode = String(payload.mode ?? 'user');

    if (mode === 'guest') {
      const guestInput = payload.guestDispatch as DispatchGuestTransactionalInput | undefined;
      if (!guestInput?.tenantId || !guestInput.guestId || !guestInput.guestEmail) {
        throw new Error('notification-dispatch guest job missing guestDispatch payload');
      }
      const result = await notificationDispatchService.dispatchGuestTransactional(guestInput);
      if (result.errors.length > 0) {
        throw new Error(result.errors.join('; '));
      }
      return;
    }

    const userInput = payload.userDispatch as DispatchNotificationInput | undefined;
    if (!userInput?.tenantId || !userInput.userId) {
      throw new Error('notification-dispatch user job missing userDispatch payload');
    }
    const result = await notificationDispatchService.dispatch(userInput);
    if (result.errors.length > 0 && result.channelsSent.length === 0) {
      throw new Error(result.errors.join('; '));
    }
  });

  handlersRegistered = true;
  securityLogger.info('[DurableScheduler] Handlers registered', {
    types: ['night-audit', 'payment-outbox-dispatch', 'intelligence-digest', 'notification-dispatch'],
  });
}

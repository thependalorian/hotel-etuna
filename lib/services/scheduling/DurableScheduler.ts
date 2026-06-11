/**
 * Durable Scheduler — Resilient cron & webhook execution with outbox pattern.
 * 
 * Purpose: Execute scheduled tasks with retry, idempotency, and durability guarantees.
 * Inspired by: inngest-js durable execution patterns (step.run, step.fetch).
 * Location: lib/services/scheduling/DurableScheduler.ts
 * 
 * Key concepts:
 * - All tasks write to scheduler_jobs table with status tracking
 * - Exponential backoff retry logic (1m, 2m, 4m, 8m, 16m, 32m, 1h max)
 * - Idempotency via idempotencyKey
 * - Execution log for audit trail
 */

import { db } from '@/lib/db';
import {
  schedulerJobs,
  type NewSchedulerJob,
  type SchedulerJob,
} from '@/lib/db/schema';
import { and, eq, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

export type { SchedulerJob, NewSchedulerJob };

// ============================================================================
// Scheduler Configuration
// ============================================================================

export interface ScheduleJobInput {
  tenantId: string;
  jobType: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  scheduledFor?: Date;
  maxAttempts?: number;
}

export interface JobHandler {
  (job: SchedulerJob): Promise<void>;
}

const BASE_RETRY_MS = 60_000; // 1 minute
const MAX_RETRY_MS = 3_600_000; // 1 hour

// ============================================================================
// Core Durable Scheduler
// ============================================================================

export class DurableScheduler {
  private handlers = new Map<string, JobHandler>();

  /**
   * Register a handler for a job type.
   * @param jobType - Unique job type identifier (e.g. 'booking-reminder', 'intelligence-digest')
   * @param handler - Async function to execute the job
   */
  register(jobType: string, handler: JobHandler): void {
    if (this.handlers.has(jobType)) {
      securityLogger.warn(`[DurableScheduler] Overwriting handler for ${jobType}`);
    }
    this.handlers.set(jobType, handler);
  }

  /**
   * Schedule a job for execution.
   * @param input - Job details with idempotency key
   * @returns The created or existing job
   */
  async schedule(input: ScheduleJobInput): Promise<SchedulerJob> {
    const scheduledFor = input.scheduledFor ?? new Date();

    try {
      const [inserted] = await db
        .insert(schedulerJobs)
        .values({
          tenantId: input.tenantId,
          jobType: input.jobType,
          idempotencyKey: input.idempotencyKey,
          payload: input.payload,
          scheduledFor,
          nextAttemptAt: scheduledFor,
          maxAttempts: input.maxAttempts ?? 10,
          status: 'pending',
        })
        .onConflictDoNothing({ target: schedulerJobs.idempotencyKey })
        .returning();

      if (!inserted) {
        const [existing] = await db
          .select()
          .from(schedulerJobs)
          .where(eq(schedulerJobs.idempotencyKey, input.idempotencyKey))
          .limit(1);
        
        if (!existing) {
          throw new Error(`Failed to insert job and could not find existing: ${input.idempotencyKey}`);
        }
        
        securityLogger.info('[DurableScheduler] Job already scheduled', {
          idempotencyKey: input.idempotencyKey,
          status: existing.status,
        });
        return existing;
      }

      securityLogger.info('[DurableScheduler] Job scheduled', {
        id: inserted.id,
        jobType: inserted.jobType,
        scheduledFor: inserted.scheduledFor,
      });

      return inserted;
    } catch (error) {
      securityLogger.error('[DurableScheduler] Failed to schedule job', {
        jobType: input.jobType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Claim and execute pending jobs (cron worker entry point).
   * @param batchSize - Max jobs to process in one run
   * @returns Execution summary
   */
  async dispatchPending(batchSize = 25): Promise<{
    claimed: number;
    completed: number;
    failed: number;
    skipped: number;
  }> {
    return this.processPendingJobs(batchSize);
  }

  /**
   * @deprecated Use dispatchPending — kept for backward compatibility.
   */
  async processPendingJobs(batchSize = 25): Promise<{
    claimed: number;
    completed: number;
    failed: number;
    skipped: number;
  }> {
    const now = new Date();
    const claimed: SchedulerJob[] = [];

    try {
      const pending = await db.transaction(async (tx) => {
        const jobs = await tx
          .select()
          .from(schedulerJobs)
          .where(
            and(
              eq(schedulerJobs.status, 'pending'),
              or(
                isNull(schedulerJobs.nextAttemptAt),
                lte(schedulerJobs.nextAttemptAt, now),
              ),
              lt(schedulerJobs.attempts, schedulerJobs.maxAttempts),
            ),
          )
          .orderBy(schedulerJobs.scheduledFor)
          .limit(batchSize)
          .for('update', { skipLocked: true });

        if (jobs.length === 0) {
          return [];
        }

        // Mark as processing
        const ids = jobs.map((j) => j.id);
        await tx
          .update(schedulerJobs)
          .set({ status: 'processing', updatedAt: now })
          .where(
            and(
              sql`${schedulerJobs.id} = ANY(${ids})`,
            ),
          );

        return jobs;
      });

      claimed.push(...pending);
    } catch (error) {
      securityLogger.error('[DurableScheduler] Failed to claim jobs', { error });
      return { claimed: 0, completed: 0, failed: 0, skipped: 0 };
    }

    let completed = 0;
    let failed = 0;
    let skipped = 0;

    for (const job of claimed) {
      const handler = this.handlers.get(job.jobType);
      if (!handler) {
        securityLogger.warn('[DurableScheduler] No handler registered', { jobType: job.jobType });
        skipped += 1;
        await this.markFailed(job, 'No handler registered for job type');
        continue;
      }

      const startTime = Date.now();
      try {
        await handler(job);
        const executionTimeMs = Date.now() - startTime;
        await this.markCompleted(job, executionTimeMs);
        completed += 1;
      } catch (error) {
        const executionTimeMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.markFailed(job, errorMessage, executionTimeMs);
        failed += 1;
      }
    }

    if (claimed.length > 0) {
      securityLogger.info('[DurableScheduler] Batch complete', {
        claimed: claimed.length,
        completed,
        failed,
        skipped,
      });
    }

    return { claimed: claimed.length, completed, failed, skipped };
  }

  /**
   * Mark job as completed.
   */
  private async markCompleted(job: SchedulerJob, executionTimeMs: number): Promise<void> {
    const now = new Date();
    await db
      .update(schedulerJobs)
      .set({
        status: 'completed',
        completedAt: now,
        executionTimeMs,
        lastError: null,
        updatedAt: now,
      })
      .where(eq(schedulerJobs.id, job.id));
  }

  /**
   * Mark job as failed (with retry or permanent failure).
   */
  private async markFailed(job: SchedulerJob, errorMessage: string, executionTimeMs?: number): Promise<void> {
    const attempts = job.attempts + 1;
    const permanent = attempts >= job.maxAttempts;
    const now = new Date();

    await db
      .update(schedulerJobs)
      .set({
        status: permanent ? 'failed' : 'pending',
        attempts,
        lastError: errorMessage.slice(0, 2000),
        nextAttemptAt: permanent ? null : this.computeNextAttemptAt(attempts),
        executionTimeMs: executionTimeMs ?? null,
        updatedAt: now,
      })
      .where(eq(schedulerJobs.id, job.id));

    if (permanent) {
      securityLogger.error('[DurableScheduler] Job permanently failed', {
        jobId: job.id,
        jobType: job.jobType,
        attempts,
        error: errorMessage,
      });
    } else {
      securityLogger.warn('[DurableScheduler] Job failed, will retry', {
        jobId: job.id,
        jobType: job.jobType,
        attempts,
        nextAttempt: this.computeNextAttemptAt(attempts),
      });
    }
  }

  /**
   * Compute next retry timestamp with exponential backoff.
   */
  private computeNextAttemptAt(attempts: number): Date {
    const delay = Math.min(BASE_RETRY_MS * 2 ** Math.max(attempts - 1, 0), MAX_RETRY_MS);
    return new Date(Date.now() + delay);
  }

  /**
   * Cancel a scheduled job by idempotency key.
   */
  async cancel(idempotencyKey: string): Promise<boolean> {
    const [job] = await db
      .select()
      .from(schedulerJobs)
      .where(eq(schedulerJobs.idempotencyKey, idempotencyKey))
      .limit(1);

    if (!job) {
      return false;
    }

    if (job.status === 'completed' || job.status === 'failed') {
      securityLogger.warn('[DurableScheduler] Cannot cancel job in terminal state', {
        idempotencyKey,
        status: job.status,
      });
      return false;
    }

    await db
      .update(schedulerJobs)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(schedulerJobs.id, job.id));

    securityLogger.info('[DurableScheduler] Job cancelled', { idempotencyKey });
    return true;
  }

  /**
   * Get job status by idempotency key.
   */
  async getJob(idempotencyKey: string): Promise<SchedulerJob | null> {
    const [job] = await db
      .select()
      .from(schedulerJobs)
      .where(eq(schedulerJobs.idempotencyKey, idempotencyKey))
      .limit(1);

    return job ?? null;
  }

  /**
   * Retry a permanently failed job.
   */
  async retry(idempotencyKey: string): Promise<boolean> {
    const [job] = await db
      .select()
      .from(schedulerJobs)
      .where(eq(schedulerJobs.idempotencyKey, idempotencyKey))
      .limit(1);

    if (!job) {
      return false;
    }

    if (job.status !== 'failed') {
      securityLogger.warn('[DurableScheduler] Cannot retry non-failed job', {
        idempotencyKey,
        status: job.status,
      });
      return false;
    }

    await db
      .update(schedulerJobs)
      .set({
        status: 'pending',
        attempts: 0,
        nextAttemptAt: new Date(),
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(schedulerJobs.id, job.id));

    securityLogger.info('[DurableScheduler] Job retry scheduled', { idempotencyKey });
    return true;
  }
}

// ============================================================================
// Singleton Instance (for app-wide use)
// ============================================================================

export const durableScheduler = new DurableScheduler();

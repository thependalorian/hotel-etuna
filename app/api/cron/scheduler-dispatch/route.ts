/**
 * @fileoverview API route //api/cron/scheduler-dispatch
 * Location: /app/api/cron/scheduler-dispatch/route.ts
 */

/**
 * Durable scheduler dispatch cron — processes pending scheduler_jobs.
 *
 * GET /api/cron/scheduler-dispatch
 * Security: Authorization: Bearer ${CRON_SECRET}
 * Location: app/api/cron/scheduler-dispatch/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { durableScheduler } from '@/lib/services/scheduling/DurableScheduler';
import { registerSchedulerJobHandlers } from '@/lib/services/scheduling/schedulerJobHandlers';
import { securityLogger } from '@/lib/utils/security-logger';
import { cronUnauthorizedResponse, verifyCronRequest } from '@/lib/utils/cron-auth';

/** Vercel Cron — dispatch pending durable scheduler jobs */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse();
  }

  const batchSizeParam = new URL(request.url).searchParams.get('batchSize');
  const batchSize = batchSizeParam ? Number.parseInt(batchSizeParam, 10) : 25;

  try {
    registerSchedulerJobHandlers();
    const result = await durableScheduler.dispatchPending(
      Number.isFinite(batchSize) && batchSize > 0 ? batchSize : 25,
    );

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    securityLogger.error('[cron/scheduler-dispatch]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scheduler dispatch failed' },
      { status: 500 },
    );
  }
}

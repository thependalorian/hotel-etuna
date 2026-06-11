/**
 * Uptime Monitoring Cron Job (PSD-12 Compliance)
 * 
 * Purpose: Scheduled health checks for system uptime monitoring
 * Location: /app/api/cron/uptime-monitor/route.ts
 * 
 * PSD-12 Requirement: 99.9% uptime
 * 
 * Schedule: Every 1 minute (via Vercel Cron or external scheduler)
 * 
 * Vercel Cron Configuration (vercel.json):
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/uptime-monitor",
 *     "schedule": "* * * * *"
 *   }]
 * }
 * ```
 * 
 * @version 1.0.0
 * @since 2026-04-21
 */

import { NextRequest, NextResponse } from 'next/server';
import { runUptimeMonitoringCheck } from '@/lib/services/security/UptimeMonitoringService';
import { securityLogger } from '@/lib/utils/security-logger';
import { cronUnauthorizedResponse, verifyCronRequest } from '@/lib/utils/cron-auth';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max execution time

export async function GET(req: NextRequest) {
  try {
    if (!verifyCronRequest(req)) {
      return cronUnauthorizedResponse();
    }

    // Run uptime monitoring check
    await runUptimeMonitoringCheck();

    return NextResponse.json({
      success: true,
      message: 'Uptime monitoring check completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    securityLogger.error('[Cron] Uptime monitoring error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'CRON_ERROR',
          message: 'Uptime monitoring check failed',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Booking check-in reminders (one day before arrival)
 *
 * Location: app/api/cron/booking-reminders/route.ts
 * Security: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server';
import { runCheckInReminderJob } from '@/lib/services/booking/bookingLifecycleSideEffects';
import { securityLogger } from '@/lib/utils/security-logger.client';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function verifyCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

/** Vercel Cron — daily check for tomorrow’s check-ins */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorized();
  }
  try {
    const result = await runCheckInReminderJob();
    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    securityLogger.error('[cron/booking-reminders]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Reminder job failed' },
      { status: 500 }
    );
  }
}

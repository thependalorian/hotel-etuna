/**
 * Email Inbox Monitor API Endpoint
 *
 * Location: /app/api/cron/email-inbox-monitor/route.ts
 *
 * Vercel Cron invokes this path with GET. The job must run on GET (not only POST).
 * Security: Authorization: Bearer ${CRON_SECRET} (set CRON_SECRET in Vercel env; Vercel attaches it to cron requests).
 */

import { NextRequest, NextResponse } from 'next/server';
import { runEmailInboxMonitor } from '@/lib/cron/email-inbox-monitor';

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

async function executeMonitor(): Promise<NextResponse> {
  const result = await runEmailInboxMonitor();

  if (result.success) {
    return NextResponse.json(
      { message: result.message, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  }
  return NextResponse.json(
    { error: result.message, timestamp: new Date().toISOString() },
    { status: 500 }
  );
}

/** Vercel Cron uses GET — this runs the inbox monitor when authorized. */
export async function GET(request: NextRequest) {
  try {
    if (!verifyCronRequest(request)) {
      return unauthorized();
    }
    return await executeMonitor();
  } catch (error) {
    console.error('Error in email inbox monitor endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/** Manual trigger (e.g. curl) with same Bearer token. */
export async function POST(request: NextRequest) {
  try {
    if (!verifyCronRequest(request)) {
      return unauthorized();
    }
    return await executeMonitor();
  } catch (error) {
    console.error('Error in email inbox monitor endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

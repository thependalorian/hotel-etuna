/**
 * Shared Vercel Cron authentication — Bearer CRON_SECRET.
 * Location: lib/utils/cron-auth.ts
 */

import { NextRequest, NextResponse } from 'next/server';

/** Returns true when Authorization matches Bearer ${CRON_SECRET}. */
export function verifyCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export function cronUnauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

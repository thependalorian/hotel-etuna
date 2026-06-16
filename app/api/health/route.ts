/**
 * @fileoverview API route //api/health
 * Location: /app/api/health/route.ts
 */

/**
 * Health check — lightweight readiness probe for Playwright webServer and uptime monitors.
 * Location: /app/api/health/route.ts
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, service: 'hotel-etuna' }, { status: 200 });
}

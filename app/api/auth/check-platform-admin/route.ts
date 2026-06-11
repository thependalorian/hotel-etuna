/**
 * Platform admin session probe — used by /admin/platform layout client guard.
 * Location: app/api/auth/check-platform-admin/route.ts
 *
 * Response: { ok: true } when current session is a platform admin; 401/403 otherwise.
 */

import { NextResponse } from 'next/server';
import { getCurrentPlatformAdmin } from '@/lib/auth/platform-admin';

export async function GET() {
  try {
    const admin = await getCurrentPlatformAdmin();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}

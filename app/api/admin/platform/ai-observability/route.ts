/**
 * Platform AI observability — token usage, confidence evals (Buffr admin only).
 * GET /api/admin/platform/ai-observability?days=30
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/platform-admin';
import { AiObservabilityService } from '@/lib/services/platform/AiObservabilityService';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin();
    const days = Math.min(90, Math.max(7, Number(new URL(request.url).searchParams.get('days') ?? 30)));
    const summary = await new AiObservabilityService().getSummary(days);
    return NextResponse.json({ data: summary });
  } catch (error) {
    securityLogger.error('[GET ai-observability]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

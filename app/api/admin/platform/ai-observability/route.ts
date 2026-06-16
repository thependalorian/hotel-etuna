/**
 * @fileoverview API route //api/admin/platform/ai-observability
 * Location: /app/api/admin/platform/ai-observability/route.ts
 */

/**
 * Platform AI observability — token usage, confidence evals (Buffr admin only).
 * GET /api/admin/platform/ai-observability?days=30
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { AiObservabilityService } from '@/lib/services/platform/AiObservabilityService';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(request: NextRequest) {
  return withPlatformAdminAuth(request, async (req) => {
    try {
      const days = Math.min(
        90,
        Math.max(7, Number(new URL(req!.url).searchParams.get('days') ?? 30))
      );
      const summary = await new AiObservabilityService().getSummary(days);
      return NextResponse.json({ data: summary });
    } catch (error) {
      securityLogger.error('[GET ai-observability]', error);
      return NextResponse.json({ error: 'Failed to load AI observability' }, { status: 500 });
    }
  });
}

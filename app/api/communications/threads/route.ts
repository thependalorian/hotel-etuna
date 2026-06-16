/**
 * @fileoverview API route //api/communications/threads
 * Location: /app/api/communications/threads/route.ts
 */

/**
 * Communications hub — list WhatsApp guest threads (hub staff).
 * GET /api/communications/threads?escalatedOnly=true
 * Location: app/api/communications/threads/route.ts
 */

import { NextRequest } from 'next/server';
import { requireHubCommunicationsUser } from '@/lib/auth/hub-communications-auth';
import { communicationsThreadService } from '@/lib/services/communications/CommunicationsThreadService';
import { errorResponse, successResponse } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  const user = await requireHubCommunicationsUser(request);
  if (!user) {
    return errorResponse('Forbidden', 403, 'FORBIDDEN');
  }

  const escalatedOnly = request.nextUrl.searchParams.get('escalatedOnly') === 'true';
  const threads = await communicationsThreadService.listThreads(user.tenantId, {
    escalatedOnly,
  });

  return successResponse({ threads });
}

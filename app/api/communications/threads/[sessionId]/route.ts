/**
 * @fileoverview API route //api/communications/threads/[sessionId]
 * Location: /app/api/communications/threads/[sessionId]/route.ts
 */

/**
 * Communications hub — thread detail + staff reply + assign.
 * Location: app/api/communications/threads/[sessionId]/route.ts
 */

import { NextRequest } from 'next/server';
import { requireHubCommunicationsUser } from '@/lib/auth/hub-communications-auth';
import { communicationsThreadService } from '@/lib/services/communications/CommunicationsThreadService';
import { sendWhatsappOutbound } from '@/lib/services/whatsapp/sendWhatsappOutbound';
import { errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger';
import type { WhatsappProvider } from '@/lib/services/whatsapp/tenantWhatsappLookup';

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireHubCommunicationsUser(request);
  if (!user) {
    return errorResponse('Forbidden', 403, 'FORBIDDEN');
  }

  const { sessionId } = await context.params;
  const thread = await communicationsThreadService.getThreadMessages(user.tenantId, sessionId);

  if (!thread) {
    return errorResponse('Thread not found', 404, 'NOT_FOUND');
  }

  return successResponse({ thread });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await requireHubCommunicationsUser(request);
  if (!user) {
    return errorResponse('Forbidden', 403, 'FORBIDDEN');
  }

  const { sessionId } = await context.params;

  let body: { text?: string; preferredProvider?: WhatsappProvider };
  try {
    body = (await request.json()) as { text?: string; preferredProvider?: WhatsappProvider };
  } catch {
    return errorResponse('Invalid JSON body', 400, 'BAD_REQUEST');
  }

  const text = body.text?.trim();
  if (!text || text.length > 4096) {
    return errorResponse('Message text is required (max 4096 chars)', 400, 'VALIDATION_ERROR');
  }

  const thread = await communicationsThreadService.getThreadMessages(user.tenantId, sessionId);
  if (!thread?.guestPhone) {
    return errorResponse('Thread not found or not a WhatsApp session', 404, 'NOT_FOUND');
  }

  const preferred =
    body.preferredProvider ?? (thread.whatsappProvider === 'meta' ? 'meta' : undefined);

  const sendResult = await sendWhatsappOutbound({
    tenantId: user.tenantId,
    toPhone: thread.guestPhone,
    text,
    preferredProvider: preferred,
  });

  if (!sendResult.ok) {
    securityLogger.error('[communications/reply] send failed', sendResult);
    return errorResponse(sendResult.error, 502, 'SEND_FAILED');
  }

  await communicationsThreadService.appendStaffReply(
    user.tenantId,
    sessionId,
    text,
    user.email
  );

  return successResponse({ sent: true, provider: sendResult.provider });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await requireHubCommunicationsUser(request);
  if (!user) {
    return errorResponse('Forbidden', 403, 'FORBIDDEN');
  }

  const { sessionId } = await context.params;

  let body: { assignedInbox?: 'frontdesk' | 'support' };
  try {
    body = (await request.json()) as { assignedInbox?: 'frontdesk' | 'support' };
  } catch {
    return errorResponse('Invalid JSON body', 400, 'BAD_REQUEST');
  }

  if (body.assignedInbox !== 'frontdesk' && body.assignedInbox !== 'support') {
    return errorResponse('assignedInbox must be frontdesk or support', 400, 'VALIDATION_ERROR');
  }

  const ok = await communicationsThreadService.assignThread(
    user.tenantId,
    sessionId,
    body.assignedInbox
  );

  if (!ok) {
    return errorResponse('Thread not found', 404, 'NOT_FOUND');
  }

  return successResponse({ assignedInbox: body.assignedInbox });
}
